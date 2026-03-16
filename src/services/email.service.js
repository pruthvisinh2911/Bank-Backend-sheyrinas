const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    type: 'OAuth2',
    user: process.env.EMAIL_USER,
    clientId: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    refreshToken: process.env.REFRESH_TOKEN,
  },
});

// Verify the connection configuration
transporter.verify((error, success) => {
  if (error) {
    console.error('Error connecting to email server:', error);
  } else {
    console.log('Email server is ready to send messages');
  }
});

// Function to send email
const sendEmail = async (to, subject, text, html) => {
  try {
    const info = await transporter.sendMail({
      from: `"Backend-ledger" <${process.env.EMAIL_USER}>`, // sender address
      to, // list of receivers
      subject, // Subject line
      text, // plain text body
      html, // html body
    });

    console.log('Message sent: %s', info.messageId);
    console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
  } catch (error) {
    console.error('Error sending email:', error);
  }
};

async function sendRegistrationEmail(userEmail , name){
    const subject = "welcome to Backend Ledger"
    const text = `Hello ${name},\n\nThank You for registering at backend Ledger we're existed to have you on board ! \n\nBest regards, \nthe Backend legder team`;
    const html =`<p>Hello ${name},</p><p>Thank you for registering at Backend Ledger. we're excited to have you on board!</p><p>best regards,<br>the backend Ledger team</p>`

    await sendEmail(userEmail,subject,text, html);
} 

async function sendTransactionEmail(userEmail,name,amount,toAccount)
{
  const subject = "Transaction Sucessfull"
  const text = `Hello ${name}, /n/n Your Transaction of ${amount} to account was successful. /n/n Best Regards,/n The Backend Ledger Team  `; 
  const html = `<p> Hello ${name},</p><p>Your Transaction of ${amount} to Account ${toAccount} was Successful.</p><p> Best Regards,<br>The Backend Ledger Team`

  await sendEmail(userEmail,subject,text,html)
}

async function sendTransactionFailureEmail(userEmail,name,amount,toAccount){
  const subject = 'Transaction Failed'
  const text = `Hello ${name},/n/n we regret to inform you thats your transaction of ${amount} to account
  ${toAccount} was Failed`
  const html = `<p> Hello ${name},</p><p>Your Transaction of ${amount} to Account ${toAccount} was Failed.</p><p> Best Regards,<br>The Backend Ledger Team`

  await sendEmail(userEmail,subject,text,html)


}

module.exports = {
    sendRegistrationEmail,
    sendTransactionEmail,
    sendTransactionFailureEmail
};