# SMS-Activate.ru

This module can be used in other projects to handle sms verifications.

## Installation

Install through NPM

```bash
  npm install xcreator-sms-activate
```

## Usage/Examples

```javascript
const SMSActivate = require('xcreator-sms-activate');

let activate = new SMSActivate('YOUR API KEY');

    let phoneNumber = await activate.findCheapAvailableNumber('ds');

    await activate.setActivationStatus(phoneNumber.id, Enums.STATUS.ACTIVATE);

    let timeRun = 0;
    let timeout = 60;

    let checkInterval = setInterval(async () => {
        let status = await activate.getActivationCode(phoneNumber.id);

        if (timeRun >= timeout) clearInterval(checkInterval);

        if (status) {
            await activate.setActivationStatus(phoneNumber.id, Enums.STATUS.COMPLETE_ACTIVATION);
            console.log(`Your verification code is: ${status}`);
            clearInterval(checkInterval);
        } else {
            console.log(`No verification code received yet. Timeout in ${timeout - timeRun} seconds.`);
        }

        timeRun++;

    }, 1000);

```