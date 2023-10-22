const nodemailer = require('nodemailer');
const ejs = require('ejs');
const { htmlToText } = require('html-to-text');

module.exports = class Email {
  constructor(user, url) {
    const { email, username } = user;
    this.to = email;
    this.name = username;
    this.url = url;
    this.from = `Werner Schmid <${process.env.MAIL_FROM}>`;
  }

  newTransport() {
    if (process.env.NODE_ENV === 'production') {
      // Sendgrid
      return nodemailer.createTransport({
        service: 'SendGrid',
        auth: {
          user: process.env.SENDGRID_USERNAME,
          pass: process.env.SENDGRID_PASSWORD,
        },
      });
    }
    return nodemailer.createTransport({
      host: process.env.MAIL_HOST,
      port: parseInt(process.env.MAIL_PORT, 10),
      auth: {
        user: process.env.MAIL_USERNAME,
        pass: process.env.MAIL_PASSWORD,
      },
    });
  }

  // Send the actual email
  async send(template, subject) {
    const { to, from, name, url } = this;
    // Render the HTML based on a pub template
    const html = await ejs.renderFile(
      `${__dirname}/../../views/emails/base.ejs`,
      {
        template: `_${template}`,
        name,
        url,
        subject,
      },
    );

    // Define the email options
    const mailOptions = {
      from,
      to,
      subject,
      html,
      text: htmlToText(html),
    };

    // Create a transport and send email
    await this.newTransport().sendMail(mailOptions);
  }

  async sendWelcome() {
    await this.send('inscription', "Welcome to Park'N'Share!");
  }
};
