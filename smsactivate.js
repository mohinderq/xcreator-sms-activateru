const axios = require('axios');
const {Enums} = require("./enums");

/**
 * Sms-activate.ru class
 * You'll need to grab your API key from:
 *
 * https://sms-activate.ru/en/api2
 */
class SMSActivate
{
    /**
     * API-endpoint of SMS-activate.ru
     * @type {string}
     */
    BASE_URL = 'https://sms-activate.ru/stubs/handler_api.php';

    /**
     * Constructor
     * @param apiKey
     */
    constructor(apiKey) {
        if (typeof apiKey === 'string') {
            this.apiKey = apiKey;
            this.session = axios.create({baseURL: this.BASE_URL});
        } else {
            throw new Error('Your API key is not of type String.');
        }
    }

    /**
     * Our method to handle the POST-requests
     * @param action
     * @param params
     * @returns {Promise<*>}
     */
    async post(action, params) {
        const response = await this.session({
            method: 'POST',
            params: {
                api_key: this.apiKey,
                action: action,
                ...params
            }
        });

        // @TODO add some extra checks here.
        // NO_BALANCE, ERROR_SQL, BAD_ACTION, BAD_SERVICE, BAD_KEY, and so on

        return response.data;
    }

    /**
     * Gets the available balance in rubs
     * For some reason they dont respond with JSON but just a string,
     * so we have to parse the balance ourself.
     * @returns {Promise<number|*>}
     */
    async getBalance() {
        const response = await this.post('getBalance');

        if (!response.includes('ACCESS_BALANCE'))
            return 0;

        return response.split(':')[1];
    }

    /**
     * Get the available numbers for all services.
     * We then select the service we want and return that value.
     * @param service Service name with _0 for non-forwarding and _1 for forwarding (ex: ds_0)
     * @param country
     * @returns {Promise<number|*>}
     */
    async getAvailableNumbers(service, country = Enums.COUNTRIES.RUSSIA) {
        const response = await this.post('getNumbersStatus', {
            country: country,
        });

        if (typeof response[service] === 'undefined')
            throw Error('This service does not exists.');

        return response[service];
    }

    /**
     * Get an available number for a service.
     * @param service Send without the _0 or _1 (ex: ds)
     * @param country
     * @returns {Promise<{phoneNumber, id}>}
     */
    async getPhoneNumber(service, country = Enums.COUNTRIES.RUSSIA) {
        const response = await this.post('getNumber', {
            service: service,
            country: country,
        });

        if (!response.includes('ACCESS_NUMBER'))
            throw Error('No numbers available for this service.');

        let data = response.split(':');

        return {
            id: data[1],
            phoneNumber: data[2],
        };
    }

    /**
     * Get the current status of an activation.
     * It will return either null or the activation code.
     * @param id
     * @returns {Promise<*>}
     */
    async getActivationCode(id) {
        const response = await this.post('getStatus', {
            id: id,
        });

        if (!response.includes('STATUS_OK')) return null;

        return response.split(':')[1];
    }

    /**
     * Set the activation status of the order.
     * We have to let the API know the code has been send.
     *
     * Different statuses:
     *
     * 1 = Activate number <- this is obligated to send before we request a SMS
     * 3 = Request another number
     * 6 = Complete activation <- this is obligated to send after each SMS
     * 8 = Report this as a bad number and cancel
     * @param id
     * @param status
     * @returns {Promise<*>}
     */
    async setActivationStatus(id, status) {
        return await this.post('setStatus', {
            id: id,
            status: status,
        });
    }

    /**
     * Loop through all countries and find an available number.
     * @param service
     * @returns {Promise<null>}
     */
    async findCheapAvailableNumber(service) {
        let countries = Object.keys(Enums.COUNTRIES);
        let number = null;
        for await(const country of countries) {
            let availability = await this.getAvailableNumbers(`${service}_0`, Enums.COUNTRIES[country]);
            if (availability > 0) {
                number = await this.getPhoneNumber(service, Enums.COUNTRIES[country]);
            }
            if (number) break;
        }
        return number;
    }
}

module.exports = SMSActivate;