module.exports = {
  sendMail
}

async function sendMail(_email,_subject, _html) {
  const nodemailer = require('nodemailer')
  const mailConfig = require('../config/mail.json')
  
  const options = {
    host: mailConfig.host,
    secureConnecton: true,
    port: mailConfig.port,
    auth: {
      user: mailConfig.user,
      pass: mailConfig.pass,
    }
  }

  let content = 'hi, <br><br>&nbsp;&nbsp;' +_html + '<br><br>  系統通知' + new Date().toLocaleString()
  const mailOptions = {
    from: mailConfig.user,
    to: _email,
    subject: _subject,
    html: content,
  }

  const transporter = nodemailer.createTransport(options)
  const Promise = require('bluebird')
  return new Promise((resolve,reject)=>{
    transporter.sendMail(mailOptions, function(error, info){
      if (error) {
        console.log("error is "+error);
        resolve(false); // or use rejcet(false) but then you will have to handle errors
      } 
      else {
        console.log('Email sent: ' + info.response);
        resolve(true);
      }
    })
  })
}


