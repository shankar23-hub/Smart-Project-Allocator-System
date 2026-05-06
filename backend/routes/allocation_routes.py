from datetime import datetime
import io
import os
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.base import MIMEBase
from email import encoders

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required

from models.employee_model import EmployeeModel
from models.project_model import ProjectModel
from ai_engine.allocator import run_allocation
from database import get_db, get_next_id

allocation_bp = Blueprint('allocation', __name__, url_prefix='/api/allocation')


# ── PDF Generation (pure Python, no external deps) ───────────────────────────

def _generate_project_pdf_bytes(project_name, lead, team_members, skills, description, milestones, tasks, ai_summary, risk_level, start_date, end_date):
    """
    Generate a simple PDF as bytes using reportlab if available,
    otherwise fall back to a well-formatted plain-text bytes blob.
    """
    try:
        from reportlab.lib.pagesizes import A4
        from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
        from reportlab.lib.units import mm
        from reportlab.lib import colors
        from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
        from reportlab.lib.enums import TA_CENTER, TA_LEFT

        buf = io.BytesIO()
        doc = SimpleDocTemplate(buf, pagesize=A4,
                                leftMargin=20*mm, rightMargin=20*mm,
                                topMargin=20*mm, bottomMargin=20*mm)
        styles = getSampleStyleSheet()

        PRIMARY = colors.HexColor('#e63946')
        DARK = colors.HexColor('#1a1a2e')
        MID = colors.HexColor('#16213e')
        LIGHT_TEXT = colors.HexColor('#555555')

        title_style = ParagraphStyle('Title', parent=styles['Title'],
                                     fontSize=22, textColor=PRIMARY, spaceAfter=6)
        h2_style = ParagraphStyle('H2', parent=styles['Heading2'],
                                  fontSize=13, textColor=DARK, spaceAfter=4, spaceBefore=12)
        body_style = ParagraphStyle('Body', parent=styles['Normal'],
                                    fontSize=10, textColor=LIGHT_TEXT, spaceAfter=3, leading=14)
        badge_style = ParagraphStyle('Badge', parent=styles['Normal'],
                                     fontSize=9, textColor=PRIMARY)

        story = []

        # Header
        story.append(Paragraph('SPA PROJECT ALLOCATION REPORT', title_style))
        story.append(HRFlowable(width='100%', thickness=2, color=PRIMARY, spaceAfter=10))
        story.append(Paragraph(f'<b>Project:</b> {project_name}', h2_style))
        story.append(Paragraph(f'Generated: {datetime.utcnow().strftime("%d %B %Y, %H:%M UTC")}', body_style))
        story.append(Spacer(1, 8))

        # Description
        if description:
            story.append(Paragraph('Project Description', h2_style))
            story.append(Paragraph(description, body_style))
            story.append(Spacer(1, 6))

        # Dates & Risk
        story.append(Paragraph('Project Details', h2_style))
        details_data = [
            ['Start Date', start_date or 'TBD', 'End Date', end_date or 'TBD'],
            ['Risk Level', risk_level or 'Medium', 'Status', 'In Progress'],
        ]
        details_table = Table(details_data, colWidths=[40*mm, 50*mm, 40*mm, 50*mm])
        details_table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (0,-1), colors.HexColor('#f5f5f5')),
            ('BACKGROUND', (2,0), (2,-1), colors.HexColor('#f5f5f5')),
            ('FONTNAME', (0,0), (-1,-1), 'Helvetica'),
            ('FONTSIZE', (0,0), (-1,-1), 9),
            ('PADDING', (0,0), (-1,-1), 6),
            ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#dddddd')),
        ]))
        story.append(details_table)
        story.append(Spacer(1, 8))

        # Skills
        if skills:
            story.append(Paragraph('Required Skills', h2_style))
            story.append(Paragraph(' • '.join(skills), badge_style))
            story.append(Spacer(1, 8))

        # AI Summary
        if ai_summary:
            story.append(Paragraph('AI Allocation Summary', h2_style))
            story.append(Paragraph(ai_summary, body_style))
            story.append(Spacer(1, 8))

        # Project Lead
        if lead:
            story.append(Paragraph('Project Lead (AI Best Match)', h2_style))
            lead_data = [
                ['Name', lead.get('name', 'TBD')],
                ['Role', lead.get('role', 'TBD')],
                ['Match Score', f"{lead.get('matchScore', lead.get('score', 'N/A'))}%"],
                ['Department', lead.get('dept', lead.get('department', 'TBD'))],
            ]
            lead_table = Table(lead_data, colWidths=[50*mm, 120*mm])
            lead_table.setStyle(TableStyle([
                ('BACKGROUND', (0,0), (0,-1), colors.HexColor('#fff0f0')),
                ('FONTNAME', (0,0), (0,-1), 'Helvetica-Bold'),
                ('FONTSIZE', (0,0), (-1,-1), 9),
                ('PADDING', (0,0), (-1,-1), 6),
                ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#dddddd')),
                ('TEXTCOLOR', (0,0), (0,-1), PRIMARY),
            ]))
            story.append(lead_table)
            story.append(Spacer(1, 8))

        # Team Members
        if team_members:
            story.append(Paragraph('Team Members', h2_style))
            team_data = [['Name', 'Role', 'Match Score', 'Department']]
            for m in team_members:
                team_data.append([
                    m.get('name', 'TBD'),
                    m.get('role', 'TBD'),
                    f"{m.get('matchScore', m.get('score', 'N/A'))}%",
                    m.get('dept', m.get('department', 'TBD')),
                ])
            team_table = Table(team_data, colWidths=[50*mm, 50*mm, 30*mm, 50*mm])
            team_table.setStyle(TableStyle([
                ('BACKGROUND', (0,0), (-1,0), DARK),
                ('TEXTCOLOR', (0,0), (-1,0), colors.white),
                ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
                ('FONTSIZE', (0,0), (-1,-1), 9),
                ('PADDING', (0,0), (-1,-1), 6),
                ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor('#f9f9f9')]),
                ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#dddddd')),
            ]))
            story.append(team_table)
            story.append(Spacer(1, 8))

        # Milestones
        if milestones:
            story.append(Paragraph('Milestones', h2_style))
            for ms in milestones[:6]:
                story.append(Paragraph(f"📅 <b>{ms.get('name','')}</b> — {ms.get('date','TBD')}", body_style))
            story.append(Spacer(1, 8))

        # Tasks
        if tasks:
            story.append(Paragraph('Initial Tasks', h2_style))
            for i, t in enumerate(tasks[:10], 1):
                story.append(Paragraph(f"{i}. {t.get('name', t) if isinstance(t, dict) else t}", body_style))
            story.append(Spacer(1, 8))

        story.append(HRFlowable(width='100%', thickness=1, color=colors.HexColor('#dddddd'), spaceAfter=6))
        story.append(Paragraph('This report was automatically generated by the SPA AI Allocation Engine.', body_style))

        doc.build(story)
        return buf.getvalue()

    except ImportError:
        # Fallback: plain text
        lines = [
            'SPA PROJECT ALLOCATION REPORT',
            '=' * 50,
            f'Project: {project_name}',
            f'Generated: {datetime.utcnow().strftime("%d %B %Y, %H:%M UTC")}',
            '',
            'PROJECT DETAILS',
            '-' * 30,
            f'Start Date : {start_date or "TBD"}',
            f'End Date   : {end_date or "TBD"}',
            f'Risk Level : {risk_level or "Medium"}',
            f'Status     : In Progress',
            '',
        ]
        if description:
            lines += ['DESCRIPTION', '-' * 30, description, '']
        if skills:
            lines += ['REQUIRED SKILLS', '-' * 30, ', '.join(skills), '']
        if ai_summary:
            lines += ['AI SUMMARY', '-' * 30, ai_summary, '']
        if lead:
            lines += [
                'PROJECT LEAD (AI Best Match)', '-' * 30,
                f"Name        : {lead.get('name','TBD')}",
                f"Role        : {lead.get('role','TBD')}",
                f"Match Score : {lead.get('matchScore', lead.get('score','N/A'))}%",
                '',
            ]
        if team_members:
            lines += ['TEAM MEMBERS', '-' * 30]
            for m in team_members:
                lines.append(f"  • {m.get('name','TBD')} ({m.get('role','TBD')}) — {m.get('matchScore',m.get('score','N/A'))}%")
            lines.append('')
        if milestones:
            lines += ['MILESTONES', '-' * 30]
            for ms in milestones[:6]:
                lines.append(f"  📅 {ms.get('name','')} — {ms.get('date','TBD')}")
            lines.append('')
        if tasks:
            lines += ['TASKS', '-' * 30]
            for i, t in enumerate(tasks[:10], 1):
                lines.append(f"  {i}. {t.get('name', t) if isinstance(t, dict) else t}")
            lines.append('')
        lines.append('Generated by SPA AI Allocation Engine')
        return '\n'.join(lines).encode('utf-8')


# ── Email Sending ─────────────────────────────────────────────────────────────

def _send_project_email(to_email: str, to_name: str, role: str, project_name: str,
                         lead_name: str, pdf_bytes: bytes, message: str):
    """
    Send project allocation email with PDF attachment.
    Uses SMTP settings from environment variables.
    Falls back silently if SMTP is not configured.
    """
    smtp_host = os.environ.get('SMTP_HOST', '')
    smtp_port = int(os.environ.get('SMTP_PORT', 587))
    smtp_user = os.environ.get('SMTP_USER', '')
    smtp_pass = os.environ.get('SMTP_PASS', '')
    smtp_from = os.environ.get('SMTP_FROM', smtp_user or 'noreply@spa.com')

    if not smtp_host or not smtp_user:
        # SMTP not configured – skip silently (notification DB record is still saved)
        return False

    try:
        msg = MIMEMultipart('mixed')
        msg['From'] = f'SPA Admin <{smtp_from}>'
        msg['To'] = to_email
        msg['Subject'] = f'[SPA] Project Allocation: {project_name}'

        role_badge = '👑 Project Lead' if role == 'Project Head' else '👤 Team Member'
        html_body = f"""
<html>
<body style="font-family: Arial, sans-serif; background:#f5f5f5; padding:20px;">
  <div style="max-width:600px;margin:auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.1);">
    <div style="background:#1a1a2e;padding:24px;text-align:center;">
      <h1 style="color:#e63946;margin:0;font-size:22px;">SPA</h1>
      <p style="color:#aaa;margin:6px 0 0;">Project Allocation Notification</p>
    </div>
    <div style="padding:24px;">
      <p style="font-size:16px;">Hi <b>{to_name}</b>,</p>
      <p style="color:#555;">{message}</p>
      <div style="background:#f9f9f9;border-left:4px solid #e63946;padding:14px;border-radius:6px;margin:20px 0;">
        <b>Project:</b> {project_name}<br>
        <b>Your Role:</b> {role_badge}<br>
        <b>Project Lead:</b> {lead_name}
      </div>
      <p style="color:#555;">The full project allocation report is attached as a PDF. Please review the details, milestones, and tasks.</p>
      <p style="color:#aaa;font-size:12px;margin-top:20px;">This is an automated message from SPA AI Allocation Engine. Please do not reply to this email.</p>
    </div>
  </div>
</body>
</html>
"""
        msg.attach(MIMEText(html_body, 'html'))

        # Attach PDF
        part = MIMEBase('application', 'octet-stream')
        part.set_payload(pdf_bytes)
        encoders.encode_base64(part)
        safe_name = project_name.replace(' ', '_').replace('/', '_')[:40]
        part.add_header('Content-Disposition', f'attachment; filename="SPA_Project_{safe_name}.pdf"')
        msg.attach(part)

        with smtplib.SMTP(smtp_host, smtp_port) as server:
            server.ehlo()
            server.starttls()
            server.login(smtp_user, smtp_pass)
            server.sendmail(smtp_from, to_email, msg.as_string())

        return True

    except Exception as exc:
        print(f'[SMTP] Failed to send email to {to_email}: {exc}')
        return False


# ── Routes ────────────────────────────────────────────────────────────────────

@allocation_bp.route('/run', methods=['POST'])
@jwt_required()
def run():
    body = request.get_json() or {}
    project_id = body.get('projectId')
    required_skills = body.get('requiredSkills', [])
    project_name = body.get('projectName', '')

    project = ProjectModel.get_by_id(project_id) if project_id else None
    if project_name and project is None:
        project = {'name': project_name, 'tech': required_skills, 'teamSize': body.get('teamSize', 3)}
    employees = EmployeeModel.get_all()

    if not employees:
        return jsonify({'success': False, 'message': 'No employees found in database'}), 404

    result = run_allocation(employees, project, required_skills)

    if result.get('best') and (project or project_name):
        best = result['best']
        proj_id = (project or {}).get('id', 0)
        proj_name = (project or {}).get('name', project_name or 'Ad-hoc Allocation')
        now = datetime.utcnow()
        try:
            db = get_db()
            new_id = get_next_id('allocations')
            db.allocations.insert_one({
                'id': new_id,
                'project_id': proj_id,
                'project': proj_name,
                'employee_id': best['id'],
                'employee': best['name'],
                'score': best['matchScore'],
                'status': 'Accepted',
                'date': now.strftime('%Y-%m-%d'),
                'allocatedAt': now.isoformat(),
                'team': [m.get('name') for m in result.get('recommendedTeam', [])],
                'summary': result.get('analysis', {}).get('summary', ''),
            })
        except Exception:
            pass

    return jsonify(result)


@allocation_bp.route('/history', methods=['GET'])
@jwt_required()
def history():
    db = get_db()
    records = list(db.allocations.find({}, {'_id': 0}).sort('allocatedAt', -1).limit(50))
    return jsonify(records)


@allocation_bp.route('/send-project-notifications', methods=['POST'])
@jwt_required()
def send_project_notifications():
    """
    Called by the Admin frontend after saving a project.
    - Saves DB notifications for lead + all team members
    - Generates a PDF report with full project details
    - Emails the PDF to each allocated member (if SMTP configured)
    Returns: { success: True, notified: [...], emailsSent: int }
    """
    body = request.get_json() or {}

    project_id   = body.get('projectId')
    project_name = body.get('projectName', 'AI-Allocated Project')
    description  = body.get('description', '')
    skills       = body.get('skills', [])
    ai_summary   = body.get('aiSummary', '')
    risk_level   = body.get('riskLevel', 'Medium')
    start_date   = body.get('startDate', '')
    end_date     = body.get('endDate', '')
    milestones   = body.get('milestones', [])
    tasks        = body.get('tasks', [])
    lead         = body.get('lead')          # {id, name, role, matchScore, dept, ...}
    team_members = body.get('teamMembers', [])  # [{id, name, role, matchScore, ...}]

    lead_name = lead.get('name', 'TBD') if lead else 'TBD'

    db = get_db()
    now = datetime.utcnow()
    notified = []
    emails_sent = 0

    # Generate PDF once for all recipients
    try:
        pdf_bytes = _generate_project_pdf_bytes(
            project_name=project_name,
            lead=lead,
            team_members=team_members,
            skills=skills,
            description=description,
            milestones=milestones,
            tasks=tasks,
            ai_summary=ai_summary,
            risk_level=risk_level,
            start_date=start_date,
            end_date=end_date,
        )
    except Exception as exc:
        print(f'[PDF] Generation error: {exc}')
        pdf_bytes = b''

    def _save_and_notify(member, role):
        nonlocal emails_sent
        if not member or not member.get('id'):
            return
        emp_id = int(member['id'])
        msg = (
            f'You have been assigned as Project Lead for "{project_name}". '
            f'The SPA AI engine selected you based on your skills and performance score ({member.get("matchScore","N/A")}%).'
            if role == 'Project Head'
            else
            f'You have been added as a Team Member for "{project_name}". '
            f'Project Lead: {lead_name}. Please check the attached PDF for full project details.'
        )

        # Save DB notification
        try:
            nid = get_next_id('notifications')
            doc = {
                'id':           nid,
                'employeeId':   emp_id,
                'employeeName': member.get('name', ''),
                'type':         'project_allocation',
                'role':         role,
                'projectId':    project_id,
                'projectName':  project_name,
                'message':      msg,
                'read':         False,
                'sentAt':       now.isoformat(),
                'createdAt':    now.isoformat(),
            }
            db.notifications.insert_one(doc)
        except Exception as exc:
            print(f'[Notification] DB save error: {exc}')

        # Fetch employee email from DB
        try:
            emp_doc = db.employees.find_one({'id': emp_id}, {'_id': 0, 'email': 1})
            emp_email = (emp_doc or {}).get('email', '')
            # Also check staff_ids for email
            if not emp_email:
                sid_doc = db.staff_ids.find_one({'employeeId': emp_id}, {'_id': 0, 'email': 1})
                emp_email = (sid_doc or {}).get('email', '')
        except Exception:
            emp_email = ''

        # Send email with PDF
        if emp_email and pdf_bytes:
            sent = _send_project_email(
                to_email=emp_email,
                to_name=member.get('name', ''),
                role=role,
                project_name=project_name,
                lead_name=lead_name,
                pdf_bytes=pdf_bytes,
                message=msg,
            )
            if sent:
                emails_sent += 1

        notified.append({
            'id':    emp_id,
            'name':  member.get('name', ''),
            'role':  role,
            'email': emp_email,
        })

    # Process lead
    if lead:
        _save_and_notify(lead, 'Project Head')

    # Process team members
    for member in team_members:
        _save_and_notify(member, 'Team Member')

    return jsonify({
        'success':    True,
        'notified':   notified,
        'emailsSent': emails_sent,
        'pdfGenerated': bool(pdf_bytes),
    }), 200
