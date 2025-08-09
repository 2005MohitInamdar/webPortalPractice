import smtplib
from email.message import EmailMessage
from shared import receivedEmails

def send_email_to_passed(email):
    msg = EmailMessage()
    msg['Subject']='Python script for sending emails'
    msg['From']='1970mohitinamdar@gmail.com'
    msg['To']='inamdarmohit4@gmail.com'
    msg.set_content('THIS IS THE TEST EMAIL SEND USING PYTHON')

    with smtplib.SMTP_SSL('smtp.gmail.com', 465) as smtp:
        smtp.login('1970mohitinamdar@gmail.com', 'oarr cdpi lazz bbxp')
        smtp.send_message(msg)

    print('Email send successfully!')