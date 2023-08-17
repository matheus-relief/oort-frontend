import { get, isNil, set } from 'lodash';
import { Question } from 'survey-angular';

/** Default properties of the ChoicesRestful class */
const DEFAULT_PROPERTIES = [
  // New properties
  'usePost',
  'requestBody',

  // Default properties
  'url',
  'path',
  'valueName',
  'titleName',
  'imageLinkName',
  'allowEmptyResponse',
  'attachOriginalItems',
] as const;

/** Class used internally by surveyJS, but not exported */
class XmlParser {
  private parser = new DOMParser();
  // eslint-disable-next-line jsdoc/require-jsdoc
  public assignValue(target: any, name: string, value: any) {
    if (Array.isArray(target[name])) {
      target[name].push(value);
    } else if (target[name] !== undefined) {
      target[name] = [target[name]].concat(value);
    } else if (
      typeof value === 'object' &&
      Object.keys(value).length === 1 &&
      Object.keys(value)[0] === name
    ) {
      target[name] = value[name];
    } else {
      target[name] = value;
    }
  }
  // eslint-disable-next-line jsdoc/require-jsdoc
  public xml2Json(xmlNode: any, result: any) {
    if (xmlNode.children && xmlNode.children.length > 0) {
      for (let i = 0; i < xmlNode.children.length; i++) {
        const childNode = xmlNode.children[i];
        const childObject = {};
        this.xml2Json(childNode, childObject);
        this.assignValue(result, childNode.nodeName, childObject);
      }
    } else {
      this.assignValue(result, xmlNode.nodeName, xmlNode.textContent);
    }
  }
  // eslint-disable-next-line jsdoc/require-jsdoc
  public parseXmlString(xmlString: string) {
    const xmlRoot = this.parser.parseFromString(xmlString, 'text/xml');
    const json = {};
    this.xml2Json(xmlRoot, json);
    return json;
  }
}

/**
 * Overwrite some ChoicesRestful methods to allow POST requests
 *
 * @param Survey Survey instance
 */
export const init = (Survey: any): void => {
  Survey.Serializer.addProperty('selectBase', {
    name: 'requestBody:expression',
    category: 'choicesByUrl',
    visibleIndex: 3,
    required: true,
    onExecuteExpression: (obj: Question, res: string) => {
      if (!obj.choicesByUrl) {
        return;
      }
      // Checks if Is GraphQL query or not
      if (obj.isGraphQL) {
        obj.choicesByUrl.requestBody = JSON.stringify({ query: res });
      } else {
        obj.choicesByUrl.requestBody = res;
      }
      obj.choicesByUrl.sendRequest();
    },
  });

  Survey.Serializer.addProperty('selectBase', {
    name: 'isGraphQL:boolean',
    displayName: 'Is GraphQL query',
    category: 'choicesByUrl',
  });

  Survey.Serializer.addProperty('selectBase', {
    name: 'usePost:boolean',
    displayName: 'Use POST',
    category: 'choicesByUrl',
  });

  /**
   * Overwrite choices restful setData method to include requestBody and usePost
   *
   * @param json Input json
   */
  Survey.ChoicesRestful.prototype.setData = function (json: any) {
    this.clear();

    const properties = (this.getCustomPropertiesNames() ?? []).concat(
      DEFAULT_PROPERTIES
    );
    for (let i = 0; i < properties.length; i++) {
      if (!isNil(json[properties[i]])) {
        set(this, properties[i], json[properties[i]]);
      }
    }
  };

  /** @returns ChoicesRestful data, including new properties */
  Survey.ChoicesRestful.prototype.getData = function () {
    if (this.isEmpty) return null;
    const res = {} as any;
    const properties = (this.getCustomPropertiesNames() ?? []).concat(
      DEFAULT_PROPERTIES
    );
    for (let i = 0; i < properties.length; i++) {
      if (!isNil(this[properties[i]])) {
        set(res, properties[i], this[properties[i]]);
      }
    }
    return res;
  };

  /** Overwrites clear method, to also clear requestBody and usePost */
  Survey.ChoicesRestful.prototype.clear = function () {
    this.requestBody = '';
    this.usePost = false;

    // Previous code
    this.url = '';
    this.path = '';
    this.valueName = '';
    this.titleName = '';
    this.imageLinkName = '';
    const properties = this.getCustomPropertiesNames();
    for (let i = 0; i < properties.length; i++) {
      if (this[properties[i]]) {
        set(this, properties[i], '');
      }
    }
  };

  /**
   * Overwrite choices restful getResultAfterPath method to allow nested paths
   *
   * @param result Result fetched from API
   * @returns Result after path is applied
   */
  Survey.ChoicesRestful.prototype.getResultAfterPath = function (result: any) {
    if (!result) return result;
    if (!this.processedPath) return result;
    const paths = this.getPathes();
    for (let i = 0; i < paths.length; i++) {
      result = get(result, paths[i]);
      if (!result) return null;
    }
    return result;
  };

  /** Overwrites sendRequest to be able to make POST requests */
  Survey.ChoicesRestful.prototype.sendRequest = function () {
    this.error = null;

    const headers = new Headers();
    headers.append(
      'Content-Type',
      this.requestBody
        ? 'application/json'
        : 'application/x-www-form-urlencoded'
    );

    const options: RequestInit = {
      headers,
    };

    Object.assign(options, { method: this.usePost ? 'POST' : 'GET' });
    if (this.requestBody) Object.assign(options, { body: this.requestBody });

    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this;

    if (Survey.ChoicesRestful.onBeforeSendRequest) {
      Survey.ChoicesRestful.onBeforeSendRequest(this, { request: options });
    }
    this.beforeSendRequest();

    fetch(this.processedUrl, options)
      .then((response) => {
        self.beforeLoadRequest();
        if (response.ok) {
          return response.json();
        } else {
          throw new Error(response.statusText);
        }
      })
      .then((data) => {
        self.onLoad(self.parseResponse(data), self.objHash);
      })
      .catch((error) => {
        self.onError(error.message);
      });
  };

  /**
   * Overwrite choices restful parseResponse method to allow JSON responses
   *
   * @param response Response from API
   * @returns Parsed response
   */
  Survey.ChoicesRestful.prototype.parseResponse = function (response: any) {
    let parsedResponse;
    if (
      !!response &&
      typeof response.indexOf === 'function' &&
      response.indexOf('<') === 0
    ) {
      const parser = new XmlParser();
      parsedResponse = parser.parseXmlString(response);
    } else {
      try {
        parsedResponse =
          typeof response === 'string' ? JSON.parse(response) : response;
      } catch (_a) {
        parsedResponse = (response || '')
          .split('\n')
          .map(function (s: any) {
            return s.trim(' ');
          })
          .filter(function (s: any) {
            return !!s;
          });
      }
    }
    return parsedResponse;
  };
};