const { unused, http } = require("svcorelib");
const _http = require("http");

const convertFileFormat = require("../fileFormatConverter");
const parseURL = require("../parseURL");
const tr = require("../translate");
const { isValidLang } = require("../languages");

const settings = require("../../settings");
const endpointsTrFile = require(`.${settings.endpoints.translationsFile}`);


//#MARKER type stuff
unused("types:", _http);

/**
 * @typedef {object} TranslatedStrings
 * @prop {string} lang Language code
 * @prop {string} text Translated text
 */

/**
 * @typedef {object} EndpointMeta
 * @prop {object} usage How to use this endpoint
 * @prop {string} usage.method HTTP method
 * @prop {string[]} usage.supportedParams An array of supported URL parameters
 */

/**
 * @typedef {object} TranslationsObj
 * @prop {TranslatedStrings[]} names Display name translations of this endpoint
 * @prop {TranslatedStrings[]} descriptions Description translations of this endpoint
 */

//#MARKER class def + constructor
/**
 * Base class for all of JokeAPI's endpoints
 * @since 2.4.0 - Implemented because of issue #243
 */
class Endpoint {
    /**
     * Constructs a new object of class Endpoint  
     * This class is intended to be subclassed! Don't use it "raw" like this!
     * @param {string} pathName At which path this endpoint will be called
     * @param {EndpointMeta} meta Meta information about this endpoint
     */
    constructor(pathName, meta)
    {
        if(typeof pathName !== "string")
            throw new TypeError(`Parameter "pathName" is not of type string (got "${typeof pathName}")`);

        if(typeof displayName !== "string")
            throw new TypeError(`Parameter "displayName" is not of type string (got "${typeof displayName}")`);

        if(typeof meta !== "object")
            throw new TypeError(`Parameter "meta" is not of type object (got "${typeof meta}")`);
        
        /** @type {TranslationObj} */
        this.translations = Endpoint.getTranslations(pathName);

        this.pathName = pathName;
        this.meta = meta;
    }

    //#MARKER "normal" methods
    /**
     * Returns this endpoint's meta object
     * @returns {EndpointMeta}
     */
    getMeta()
    {
        return this.meta;
    }

    /**
     * Returns the path name at which this endpoint should be called
     * @returns {string}
     */
    getPathName()
    {
        return this.pathName;
    }

    /**
     * Returns the display name of this endpoint, in the specified language
     * @param {string} langCode
     * @returns {string} Returns the translation of value `settings.languages.defaultLanguage` if no translation was found
     */
    getDisplayName(langCode)
    {
        if(!isValidLang(langCode))
            throw new TypeError(`Parameter "langCode" is not a valid language code`);

        let dispName = this.meta.names.find(n => n.lang == langCode);

        // if dispName is undefined, no name exists for the provided langCode so default to the default language
        if(!dispName)
            dispName = this.meta.names.find(n => n.lang == settings.languages.defaultLanguage);

        return dispName.text;
    }

    /**
     * Returns the description of this endpoint, in the specified language
     * @param {string} langCode
     * @returns {string} Returns the translation of value `settings.languages.defaultLanguage` if no translation was found
     */
    getDescription(langCode)
    {
        if(!isValidLang(langCode))
            throw new TypeError(`Parameter "langCode" is not a valid language code`);

        let description = this.meta.descriptions.find(d => d.lang == langCode);

        // if description is undefined, no description exists for the provided langCode so default to the default language
        if(!description)
            description = this.meta.descriptions.find(d => d.lang == settings.languages.defaultLanguage);

        return description.text;
    }

    //#MARKER call
    /**
     * This method is run each time a client requests this endpoint
     * @param {_http.IncomingMessage} req The HTTP server request
     * @param {_http.ServerResponse} res The HTTP server response
     * @param {string[]} url URL path array gotten from the URL parser module
     * @param {object} params URL query params gotten from the URL parser module
     * @param {string} format The file format to respond with
     */
    call(req, res, url, params, format)
    {
        unused(req, url);

        const lang = Endpoint.getLang(params);

        const data = {
            error: false,
            ping: tr(lang, "pingPong"),
            timestamp: new Date().getTime()
        };

        return Endpoint.respond(res, format, lang, data);
    }

    //#MARKER static
    /**
     * Returns the language code, retrieved from a URL parameter object
     * @static
     * @param {object} params URL query params gotten from the URL parser module
     * @returns {string}
     */
    static getLang(params)
    {
        return (params && params["lang"]) ? params["lang"] : settings.languages.defaultLanguage;
    }

    /**
     * Sends a response to the client - Runs file format auto-conversion and uses httpServer.pipeString()
     * @static
     * @param {_http.ServerResponse} res
     * @param {string} format File format
     * @param {string} lang Language code
     * @param {object} data JSON-compatible object - data to send to the client
     */
    static respond(res, format, lang, data)
    {
        const responseText = convertFileFormat.auto(format, data, lang);
    
        return http.pipeString(res, responseText, parseURL.getMimeTypeFromFileFormatString(format));
    }

    /**
     * Returns the translations object of the specified endpoint  
     * @param {string} pathName At which path this endpoint will be called
     * @throws TypeError if the pathName is invalid
     * @returns {TranslationsObj}
     */
    static getTranslations(pathName)
    {
        // const endpointsTrFile = require("../data/translations/endpoints.json");
        
        /** @type {TranslationsObj} */
        let translations = {
            names: [],
            descriptions: []
        };

        // iterate over all endpoints
        Object.keys(endpointsTrFile.tr).forEach(ep => {
            if(ep != pathName) // find the endpoint that has been specified with `pathName`
                return;

            const names = endpointsTrFile.tr[ep].name;
            const descriptions = endpointsTrFile.tr[ep].desc;

            // iterate over the current endpoint's names
            Object.keys(names).forEach(lang => {
                let val = names[lang];

                translations.names.push({
                    lang,
                    text: val
                });
            });

            // iterate over the current endpoint's descriptions
            Object.keys(descriptions).forEach(lang => {
                let val = descriptions[lang];

                translations.descriptions.push({
                    lang,
                    text: val
                });
            });
        });

        return translations;
    }
}

module.exports = Endpoint;