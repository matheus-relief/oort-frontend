import { Injectable } from '@angular/core';
import { SafeApiProxyService } from './api-proxy.service';
import { QueryBuilderService } from './query-builder.service';
import { SafeSnackBarService } from './snackbar.service';
import get from 'lodash/get';
import { Apollo } from 'apollo-angular';
import { NOTIFICATIONS } from '../const/notifications';

const cloneData = (data: any[]) => data.map(item => Object.assign({}, item));

const OPTION_QUESTIONS = ['dropdown', 'radiogroup', 'tagbox', 'checkbox', 'owner'];

@Injectable({
  providedIn: 'root'
})
export class SafeEmailService {

  constructor(
    private apollo: Apollo,
    private apiProxyService: SafeApiProxyService,
    private queryBuilder: QueryBuilderService,
    private snackBar: SafeSnackBarService
  ) { }

  /**
   * Opens a mail client with items in the body.
   * @param recipient recipient of the email.
   * @param subject subject of the email.
   * @param settings query settings.
   */
  public sendMail(recipient: string, subject: string, settings: any, totalCount: number): void {
    const builtQuery = this.queryBuilder.buildQuery(settings);
    if (builtQuery) {
      const dataQuery = this.apollo.watchQuery<any>({
        query: builtQuery,
        variables: {
          first: totalCount
        }
      });
      const metaQuery = this.queryBuilder.buildMetaQuery(settings, false);
      let metaFields: any = [];
      let fields: any = [];
      let items: any = [];
      if (metaQuery) {
        metaQuery.subscribe(async (res: any) => {
          for (const metaField in res.data) {
            if (Object.prototype.hasOwnProperty.call(res.data, metaField)) {
              metaFields = Object.assign({}, res.data[metaField]);
              await this.populateMetaFields(metaFields);
              dataQuery.valueChanges.subscribe((res2: any) => {
                fields = settings.query.fields;
                for (const field in res2.data) {
                  if (Object.prototype.hasOwnProperty.call(res2.data, field)) {
                    fields = this.getFields(metaFields, fields);
                    const nodes = res2.data[field].edges.map((x: any) => x.node) || [];
                    items = cloneData(nodes);
                    this.convertDateFields(fields, items);
                  }
                }
                const body = this.buildBody(items, fields);
                try {
                window.location.href = `mailto:${recipient}?subject=${subject}&body=${encodeURIComponent(body)}`;
              } catch (error) {
                this.snackBar.openSnackBar(NOTIFICATIONS.emailTooLong(error), { error: true });
                try {
                  window.location.href = `mailto:${recipient}?subject=${subject}`;
                } catch (error) {
                  this.snackBar.openSnackBar(NOTIFICATIONS.emailClientNotResponding(error), { error: true });
                }
              }
              });
            }
          }
        });
      }
    }
  }

  /**
   * Builds the body of the email to open.
   * @param items list of items to stringify
   * @param fields fields to use for query.
   * @returns body of the email.
   */
  private buildBody(items: any[], fields: any): string {
    let body = '';
    let i = 1;
    for (const item of items) {
      body += `######   ${i}   ######\n`;
      body += this.buildBodyRow(item, fields);
      body += '______________________\n';
      i++;
    }
    return body;
  }

  /**
   * Builds a row of the email to open.
   * @param item item to stringify.
   * @param fields fields to use for query.
   * @param tabs string indentation.
   * @returns body of the email.
   */
  private buildBodyRow(item: any, fields: any, tabs = ''): string {
    let body = '';
    for (const field of fields) {
      switch (field.kind) {
        case 'LIST':
          body += `${tabs}${field.label ? field.label : field.name}:\n`;
          const list = item ? item[field.name] || [] : [];
          list.forEach((element: any, index: number) => {
            body += this.buildBodyRow(element, field.fields, tabs + '\t');
            if (index < (list.length - 1)) {
              body += `${tabs + '\t'}______________________\n`;
            }
          });
          break;
        case 'OBJECT':
          body += `${tabs}${field.label ? field.label : field.name}:\n`;
          body += this.buildBodyRow(item ? item[field.name] : null, field.fields, tabs + '\t');
          break;
        default:
          const rawValue = item ? item[field.name] : '';
          const value = rawValue && OPTION_QUESTIONS.includes(field.meta.type) ? this.getDisplayText(rawValue, field.meta) : rawValue;
          body += `${tabs}${field.label ? field.label : field.name}:   ${value}\n`;
      }
    }
    return body;
  }

  /**
   * Populates questions with choices, with meta data.
   * @param metaFields list of meta fields.
   */
  private async populateMetaFields(metaFields: any): Promise<void> {
    for (const fieldName of Object.keys(metaFields)) {
      const meta = metaFields[fieldName];
      if (meta.choicesByUrl) {
        const url: string = meta.choicesByUrl.url;
        const localRes = localStorage.getItem(url);
        if (localRes) {
          metaFields[fieldName] = {
            ...meta,
            choices: this.extractChoices(JSON.parse(localRes), meta.choicesByUrl)
          };
        } else {
          const res: any = await this.apiProxyService.promisedRequestWithHeaders(url);
          localStorage.setItem(url, JSON.stringify(res));
          metaFields[fieldName] = {
            ...meta,
            choices: this.extractChoices(res, meta.choicesByUrl)
          };
        }
      }
    }
  }

  /**
   * Extracts choices using choicesByUrl properties
   * @param res Result of http request.
   * @param choicesByUrl Choices By Url property.
   * @returns list of choices.
   */
  private extractChoices(res: any, choicesByUrl: { path?: string, value?: string, text?: string }): { value: string, text: string }[] {
    const choices = choicesByUrl.path ? [...res[choicesByUrl.path]] : [...res];
    return choices ? choices.map((x: any) => ({
      value: (choicesByUrl.value ? x[choicesByUrl.value] : x).toString(),
      text: choicesByUrl.text ? x[choicesByUrl.text] : choicesByUrl.value ? x[choicesByUrl.value] : x
    })) : [];
  }

  private flatDeep(arr: any[]): any[] {
    return arr.reduce((acc, val) => acc.concat(Array.isArray(val) ? this.flatDeep(val) : val), []);
  }

  private getFields(metaFields: any, fields: any[], prefix?: string, disabled?: boolean): any[] {
    return this.flatDeep(fields.map(f => {
      const fullName: string = prefix ? `${prefix}.${f.name}` : f.name;
      switch (f.kind) {
        case 'OBJECT': {
          return {
            name: f.name,
            title: f.label ? f.label : f.name,
            kind: 'OBJECT',
            fields: this.getFields(metaFields, f.fields, fullName, true)
          };
        }
        case 'LIST': {
          return {
            name: f.name,
            title: f.label ? f.label : f.name,
            kind: 'LIST',
            fields: this.getFields(metaFields, f.fields, fullName, true)
          };
        }
        default: {
          const metaData = get(metaFields, fullName);
          return {
            name: f.name,
            title: f.label ? f.label : f.name,
            type: f.type,
            meta: metaData
          };
        }
      }
    })).sort((a, b) => a.order - b.order);
  }

  /**
   * Transforms stored dates into readable dates.
   * @param fields list of fields.
   * @param items list of items.
   */
  private convertDateFields(fields: any[], items: any[]): void {
    const dateFields = fields.filter(x => ['Date', 'DateTime', 'Time'].includes(x.type)).map(x => x.name);
    items.map(x => {
      for (const [key, value] of Object.entries(x)) {
        if (dateFields.includes(key)) {
          x[key] = x[key] && new Date(x[key]);
        }
      }
    });
  }

  /**
   * Displays text instead of values for questions with select.
   * @param meta meta data of the question.
   * @param value question value.
   * @returns text value of the question.
   */
  public getDisplayText(value: string | string[], meta: { choices?: { value: string, text: string }[] }): string | string[] {
    if (meta.choices) {
      if (Array.isArray(value)) {
        return meta.choices.reduce((acc: string[], x) => value.includes(x.value) ? acc.concat([x.text]) : acc, []);
      } else {
        return meta.choices.find(x => x.value === value)?.text || '';
      }
    } else {
      return value;
    }
  }
}