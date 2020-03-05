const axios = require('axios');
const moment = require('moment');

let lastScan = null;

const USERS = [
  {
    id: 0,
    username: 'user.name@mail.com',
    password: 'p@ssw0rd',
    schedules: [
      { id: 0, time: '09:00', lastRegistry: null },
      { id: 1, time: '12:00', lastRegistry: null },
      { id: 2, time: '13:00', lastRegistry: null },
      { id: 3, time: '18:00', lastRegistry: null },
    ],
  },
];

async function scanAndRegistry(time) {
  console.log(`\n\nScanning for \"${time}\" schedules...`)

  USERS.map(user => {
    user.schedules.map(async schedule => {
      if(
        time === schedule.time 
        && (
          !schedule.lastRegistry 
          || !moment(schedule.lastRegistry).isSame(moment(), 'day')
        )
      ) {
        console.log(
          '\n\n',
          'User schedule finded!',
          '\n',
          `Last registry: ${moment(schedule.lastRegistry).format('LLL')}`
        );

        console.log(
          '\n\n',
          'Trying to authenticate user...',
        );

        try {
          const auth = await signIn(user.username, user.password);

          console.log(
            '\n',
            'Successfully authenticated!'
          );

          console.log(
            '\n\n',
            'Trying to submit registry...'
          );

          try {
            await registry({
              token: auth.data.token,
              client: auth.data.client_id,
              uid: auth.data.email,
              expiry: auth.headers.expiry,
            });

            console.log(
              '\n',
              'Successfully submitted resgistry!'
            );
          } catch(e) {
            console.log(`Registry error for user: ${user.username}\n`);
          }

          schedule.lastRegistry = moment();
        } catch(e) {
          console.log(`Login error for user: ${user.username}\n`);
        }
      }
    });
  });

  lastScan = moment();

  console.log(JSON.stringify(USERS), '\n', lastScan, '\n');
}

async function signIn(username, password) {
  const response = await axios({
    method: 'POST',
    headers: {
      'Host': 'api.pontomais.com.br',
      'Content-Type': 'application/json;charset=utf-8',
      'Accept': 'application/json, text/plain, */*',
      'Api-Version': 'Api-Version',
      'uuid': '5bf93f59-bd12-4d0d-b96d-f0dd274a1d2d',
      'Origin': 'https://app.pontomaisweb.com.br',
      'Referer': 'https://app.pontomaisweb.com.br/',
    },
    data: {
      "login": username,
      "password": password,
    },
    url: 'https://api.pontomais.com.br/api/auth/sign_in',
  })

  return response;
}

async function registry({ token, client, expiry, uid }) {
  const response = await axios({
    method: 'POST',
    headers: {
      'Host': 'api.pontomais.com.br',
      'Content-Type': 'application/json;charset=utf-8',
      'Accept': 'application/json, text/plain, */*',
      'Api-Version': 'Api-Version',
      'uuid': '5bf93f59-bd12-4d0d-b96d-f0dd274a1d2d',
      'Origin': 'https://app.pontomaisweb.com.br',
      'Referer': 'https://app.pontomaisweb.com.br/',

      'access-token': token,
      'token-type': 'Bearer',
      'client': client,
      'expiry': expiry,
      'uid': uid,
    },
    data: {
      "time_card": {
        "latitude":-22.8470244,
        "longitude":-47.085695,
        "address":"Praça Capital - Av. José Rocha Bomfim, 214 - Jardim Santa Genebra, Campinas - SP, 13080-650, Brasil",
        "reference_id":null,
        "location_edited":false,
        "accuracy":3374
      },
      "_path":"/meu_ponto/registro_de_ponto",
      "_device": {      
        "browser": {
          "name":"Firefox",
          "version":"73.0",
          "versionSearchString":"Firefox"
        }
      },
      "_appVersion":"0.10.32"
    }
  });

  return response;
}

function withZero(number) {
  return number < 10 ? `0${number}` : `${number}`;
}

function loop() {
  const now = moment();

  if((now.minutes() % 5) === 0) {
    const time = `${withZero(now.hours())}:${withZero(now.minutes())}}`;

    scanAndRegistry(time);
  }

  setTimeout(loop, 60000);
}

loop();