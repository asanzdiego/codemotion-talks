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
    +'<h1>Codemotion Madrid 2018 Talks</h1>\n'
  for (let index = 0; index < talksUrls.length; index++) {
    const talkUrl = talksUrls[index];
    html += await formatTalk(page, talkUrl);
  }
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

  await page.goto(talkUrl);
  const speaker = await page.$eval('#speaker h1', element => element.innerText);
  
  try {

    const headers = await page.$$eval('.sp-wrapper-talk h3', elements => { 
      return elements.map(element => element.innerText);
    })
    const talk = headers[0];
    const language = headers[1];
    const level = headers[2];
    const abstract = await page.$eval('.sp-abstract-talk', element => element.innerText);
    const urlVideo = await page.$eval('#video-embed', element => element.src);
    const html = '<h2>'+speaker+'</h2>\n'
      +'<a href="'+urlVideo.replace('embed/', 'watch?v=')+'">'+talk+'</a>\n'
      +'<p>'+abstract+'</p>\n'
      +'<p><strong>'+language+'</strong></p>\n'
      +'<p><strong>'+level+'</strong></p>\n';
    console.log(speaker+' | '+talk);
    return html;
      
  } catch (error) {
    
    console.log(speaker+' | no talk');
    return '';
  }
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