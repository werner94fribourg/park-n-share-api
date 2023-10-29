/**
 * Email module, containing the Email prototype function used to handle Email generation and sending.
 * @module Email
 */
const nodemailer = require('nodemailer');
const ejs = require('ejs');
const { htmlToText } = require('html-to-text');
const User = require('../../models/userModel');
const { Model } = require('mongoose');

/**
 * Email prototype function, used to create email templates and send it to the requested users.
 */
class Email {
  /**
   * Constructor function used to generate a new instance of an Email object.
   * @param {User} user The user to which we want to send an email.
   * @param {string} url The facultative url link we want to be contained in the email.
   */
  constructor(user, url) {
    const { email, username } = user;
    /**
     * @private
     * @readonly
     */
    this.to = email;
    /**
     * @private
     * @readonly
     */
    this.name = username;
    /**
     * @private
     * @readonly
     */
    this.url = url;
    /**
     * @private
     * @readonly
     */
    this.from = `Werner Schmid <${process.env.MAIL_FROM}>`;
  }

  /**
   * Function used to create a new transporter object that will send the email using a specific service.
   * @returns {import('nodemailer').Transporter} The new transporter object.
   * @private
   */
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

  /**
   * Async Function used to send a specific template file email to the requested user.
   * @param {string} template The template ejs file we want to send as an email.
   * @param {string} subject The subject of the email.
   * @private
   */
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

  /**
   * Async function used to send a welcome email to the user.
   */
  async sendWelcome() {
    await this.send('inscription', "Welcome to Park'N'Share!");
  }

  /**
   * Async function used to send a confirmation email to the user such that he can confirm his email address.
   */
  async sendEmailConfirmation() {
    await this.send('confirmEmail', 'Please confirm your email address.');
  }

    async sendPasswordReset() {
      await this.send(
          'passwordReset',
          'Your password reset token (valid for only 10 minutes)'
      );
    }
}

module.exports = Email;
