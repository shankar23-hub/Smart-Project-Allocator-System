# Country / State / City Fix Notes

Corrected files:

1. `frontend/src/pages/StaffProfiles.jsx`
   - Replaced manual country/state/city arrays with `country-state-city`.
   - Country dropdown loads all countries.
   - State dropdown loads based on selected country.
   - City dropdown loads based on selected state.
   - Saves `country`, `countryCode`, `state`, `stateCode`, and `city`.

2. `frontend/src/utils/api.js`
   - Preserves `countryCode` and `stateCode` when sending/receiving employee data.

3. `backend/models/employee_model.py`
   - Stores `countryCode` and `stateCode` in MongoDB.

4. `frontend/package.json`
   - Added dependency: `country-state-city`.

Run after extracting:

```bash
cd frontend
npm install
npm run dev
```

Backend:

```bash
cd backend
pip install -r requirements.txt
python app.py
```
