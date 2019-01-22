const puppeteer = require('puppeteer');
const fs = require('fs');

var email = process.argv[2];
var password = process.argv[3];

async function run() {
  
  const browser = await puppeteer.launch({
    headless: false
  });
  const page = await browser.newPage();
  const talksUrls = await getTalksUrls(page);
  const html = await formatTalks(page, talksUrls);
  await saveToFile(html);
  browser.close();
}

async function getTalksUrls(page) {
    
  await page.goto('https://madrid2018.codemotionworld.com/speakers/');
  const talksUrls = await page.$$eval('#speaker a', elements => {
    return elements.map(element => element.href);
  });
  console.log(talksUrls.length + " talks urls retrieved");
  return talksUrls;
}

async function formatTalks(page, talksUrls) {

  await login(page);
  let html = '<!DOCTYPE html>\n'
    +'<html>\n'
    +'<head>\n'
    +'<meta http-equiv="Content-Type" content="text/html; charset=utf-8">\n'
    +'<title>Codemotion Madrid 2018 Talks</title>\n'
    +'</head>\n'
    +'<body>\n'
    +'<h1>Codemotion Madrid 2018 Talks</h1>\n';
  for (let index = 0; index < talksUrls.length; index++) {
    const talkUrl = talksUrls[index];
    html += await formatTalk(page, talkUrl);
  }
  //html += await formatTalk(page, 'https://madrid2018.codemotionworld.com/speaker/4294/');
  return html;
}

async function login(page) {

  await page.goto('https://id.codemotion.com/');
  await page.click('#email');
  await page.keyboard.type(email);
  await page.click('#password');
  await page.keyboard.type(password);
  await page.click('button[type="submit"]');
  await page.waitForNavigation();
  console.log('logged in');
}

async function formatTalk(page, talkUrl) {

  let html = '\n<hr />\n';

  await page.goto(talkUrl);

  const speakerImg = await page.$eval('#speaker img', element => element.src);
  html += '<img width="200" src="'+speakerImg+'"/>\n';

  const speakerName = await page.$eval('#speaker h1', element => element.innerText);
  html += '<h2>'+speakerName+'</h2>\n';
  console.log(speakerName);

  const speakerDesc = await page.$eval('#speaker h2', element => element.innerText);
  html += '<p><strong>'+speakerDesc+'</strong></p>\n';

  const speakerBio = await page.$eval('#speaker p', element => element.innerText);
  html += '<p>'+speakerBio+'</p>\n';
  
  try {
    const website = await page.$eval('a.website', element => element.href);
    html += '<p><strong>Website: </strong><a href="'+website+'">'+website+'</a></p>\n';
  } catch (error) {
    console.log(speakerName + ' no website');
  }
  
  try {
    const linkedin = await page.$eval('a.linkedin', element => element.href);
    html += '<p><strong>Linkedin: </strong><a href="'+linkedin+'">'+linkedin+'</a></p>\n';
  } catch (error) {
    console.log(speakerName + ' no linkedin');
  }
  
  try {
    const twitter = await page.$eval('a.linkedin', element => element.href);
    html += '<p><strong>Twitter: </strong><a href="'+twitter+'">'+twitter+'</a></p>\n';
  } catch (error) {
    console.log(speakerName + ' no twitter');
  }

  try {

    const headers = await page.$$eval('.sp-wrapper-talk h3', elements => { 
      return elements.map(element => element.innerText);
    })
    
    const talk = headers[0];
    html += '<h3>'+talk+'</h3>\n';

    const language = headers[1];
    html += '<p><strong>'+language+'</strong></p>\n';

    const level = headers[2];
    html += '<p><strong>'+level+'</strong></p>\n';

    const abstract = await page.$eval('.sp-abstract-talk', element => element.innerText);
    html += '<p>'+abstract+'</p>\n';

    try {
      const video = await page.$eval('#video-embed', element => element.src);
      html += '<p><strong>Vídeo: </strong><a href="'+video+'">'+video+'</a></p>\n';
    } catch (error) {
      console.log(speakerName + ' no video');
    }

    try {
      const slides = await page.$eval('.sp-box-slides iframe', element => element.src);
      html += '<p><strong>Slides: </strong><a href="'+slides+'">'+slides+'</a></p>\n';
    } catch (error) {
      console.log(speakerName + ' no slides');
    }
      
  } catch (error) {
    console.log(speakerName+' no talk');
    return '';
  }

  return html;
}

async function saveToFile(html) {

  fs.writeFile("codemotion-talks.html", html, function(err) {
    if(err) {
        return console.log(err);
    }
    console.log("codemotion-talks.html saved");
  });
}

run();