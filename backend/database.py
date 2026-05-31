"""
database.py - MongoDB Atlas connection and initialization for SPA Admin Portal.

FIX: Added staffId index to employee_portal_users collection.
FIX: Added staff_ids counter starting at 0 (seq+10000 = first SPA10001).
FIX: Consistent index creation with conflict-safe handling.
"""

from __future__ import annotations

import re
from typing import Any
from pymongo import MongoClient, ASCENDING, ReturnDocument
from pymongo.errors import ConfigurationError, ConnectionFailure, OperationFailure, PyMongoError
from config import Config

_client: MongoClient | None = None
_db = None
_last_connection_error: str | None = None


_PLACEHOLDER_PATTERNS = (
    "<db_password>",
    "<password>",
    "YOUR_PASSWORD",
    "your_password",
    "PASTE_YOUR",
    "PASTE_YOUR_REAL_PASSWORD",
)


def _validate_mongo_settings() -> None:
    if not Config.MONGO_URI:
        raise RuntimeError(
            "MONGO_URI is missing. Add it in backend/.env or Vercel Environment Variables."
        )
    if any(token in Config.MONGO_URI for token in _PLACEHOLDER_PATTERNS):
        raise RuntimeError(
            "MONGO_URI still contains a placeholder password. Replace <db_password> with your real MongoDB Atlas database user password."
        )
    if not (Config.MONGO_URI.startswith("mongodb+srv://") or Config.MONGO_URI.startswith("mongodb://")):
        raise RuntimeError("MONGO_URI must start with mongodb+srv:// or mongodb://")
    if not Config.MONGO_DB_NAME:
        raise RuntimeError("MONGO_DB_NAME is missing.")


def _hide_password(uri: str) -> str:
    return re.sub(r"(mongodb(?:\+srv)?://[^:/@]+:)([^@]+)(@)", r"\1****\3", uri)


def get_db():
    global _client, _db, _last_connection_error

    if _db is not None:
        return _db

    try:
        _validate_mongo_settings()

        _client = MongoClient(
            Config.MONGO_URI,
            serverSelectionTimeoutMS=8000,
            connectTimeoutMS=8000,
            socketTimeoutMS=12000,
            retryWrites=True,
        )
        _client.admin.command("ping")
        _db = _client[Config.MONGO_DB_NAME]
        _last_connection_error = None
        print(f"[DB] Connected to MongoDB Atlas: {_hide_password(Config.MONGO_URI)}")
        print(f"[DB] Database selected: {Config.MONGO_DB_NAME}")
        return _db

    except (ConfigurationError, ConnectionFailure, OperationFailure, PyMongoError, RuntimeError) as exc:
        _last_connection_error = str(exc)
        raise RuntimeError(
            "MongoDB Atlas connection failed. Check: 1) backend/.env MONGO_URI, "
            "2) Database Access username/password, 3) Network Access IP whitelist, "
            f"4) MONGO_DB_NAME. Details: {_last_connection_error}"
        ) from exc


def get_connection_status() -> dict[str, Any]:
    try:
        db = get_db()
        db.client.admin.command("ping")
        return {
            "connected": True,
            "database": Config.MONGO_DB_NAME,
            "message": "MongoDB Atlas connected successfully",
        }
    except Exception as exc:
        return {
            "connected": False,
            "database": Config.MONGO_DB_NAME,
            "message": str(exc),
        }


def get_next_id(collection_name: str) -> int:
    db = get_db()
    result = db.counters.find_one_and_update(
        {"_id": collection_name},
        {"$inc": {"seq": 1}},
        upsert=True,
        return_document=ReturnDocument.AFTER,
    )
    return int(result["seq"])


def _create_index_safe(collection, keys, **kwargs) -> None:
    try:
        collection.create_index(keys, **kwargs)
    except OperationFailure as exc:
        if exc.code == 86 or "IndexKeySpecsConflict" in str(exc):
            print(f"[DB] Index conflict skipped safely: {collection.name}")
        else:
            raise RuntimeError(
                f"Index creation failed for collection '{collection.name}'. "
                f"Remove duplicate values or clean the collection. Details: {exc}"
            ) from exc


def init_db() -> bool:
    """Create indexes and counters. Returns True when MongoDB is ready."""
    db = get_db()

    # Core collections
    _create_index_safe(db.employees, [("id", ASCENDING)], unique=True, background=True)
    _create_index_safe(db.employees, [("email", ASCENDING)], unique=True, sparse=True, background=True)
    _create_index_safe(db.projects, [("id", ASCENDING)], unique=True, background=True)
    _create_index_safe(db.allocations, [("id", ASCENDING)], unique=True, background=True)
    _create_index_safe(db.users, [("email", ASCENDING)], unique=True, sparse=True, background=True)
    _create_index_safe(db.users, [("username", ASCENDING)], unique=True, sparse=True, background=True)

    # Staff ID + Employee Portal indexes
    _create_index_safe(db.certifications, [("id", ASCENDING)], unique=True, background=True)
    _create_index_safe(db.certifications, [("employeeId", ASCENDING)], background=True)
    _create_index_safe(db.staff_ids, [("employeeId", ASCENDING)], unique=True, sparse=True, background=True)
    _create_index_safe(db.staff_ids, [("staffId", ASCENDING)], unique=True, sparse=True, background=True)

    # Employee Portal Users — all three lookup paths need indexes
    _create_index_safe(db.employee_portal_users, [("employeeId", ASCENDING)], unique=True, sparse=True, background=True)
    _create_index_safe(db.employee_portal_users, [("email", ASCENDING)], unique=True, sparse=True, background=True)
    _create_index_safe(db.employee_portal_users, [("staffId", ASCENDING)], unique=True, sparse=True, background=True)

    # Bootstrap counters
    for name, start in [
        ("employees", 0),
        ("projects", 0),
        ("allocations", 0),
        ("users", 0),
        ("certifications", 0),
        ("staff_ids", 0),   # seq 0 → first staff number = 0+10000+1 = 10001
    ]:
        db.counters.update_one(
            {"_id": name},
            {"$setOnInsert": {"seq": start}},
            upsert=True,
        )

    print("[DB] MongoDB collections and indexes initialised successfully.")
    return True
