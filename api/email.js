const mail = require('@sendgrid/mail');
mail.setApiKey(process.env.SENDGRID_API_KEY);

module.exports.sendEmail = (message, subject = "ACO API Warning") => {
  return new Promise((resolve, reject) => {
    const mailOptions = {
      from: 'ACO API <noreply@auctus.org>',
      to: process.env.ERROR_TO.split(";"), 
      subject: ("[" + process.env.CHAIN + "] " + subject), 
      html: message 
    };
    mail.send(mailOptions).then(() => resolve(), (error) => reject(error));
  });
};