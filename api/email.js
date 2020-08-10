const nodeMailer = require('nodemailer');

module.exports.sendEmail = (message, subject = "ACO API Warning") => {
  const transporter = nodeMailer.createTransport({
    host: 'pro.turbo-smtp.com',
    port: 587,
    secure: false, 
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD
    }
  });
  const mailOptions = {
    from: '"ACO API" <noreply@auctus.org>',
    to: process.env.ERROR_TO, 
    subject: ("[" + process.env.CHAIN + "] " + subject), 
    html: message 
  };
  return transporter.sendMail(mailOptions);
};