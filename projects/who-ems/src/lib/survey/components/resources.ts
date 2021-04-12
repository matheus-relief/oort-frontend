export function init(Survey: any, API_URL: string): void {
    const component = {
        name: 'resources',
        title: 'Resources',
        category: 'Custom Questions',
        questionJSON: {
            name: 'resources',
            type: 'tagbox',
            optionsCaption: 'Select a resource...',
            choicesOrder: 'asc',
            choices: [],
        },
        onInit(): void {
            Survey.Serializer.addProperty('resources', {
                name: 'resource',
                category: 'Custom Questions',
                visibleIndex: 3,
                required: true,
                choices: (obj: any, choicesCallback: any) => {
                    const xhr = new XMLHttpRequest();
                    const query = {
                        query: `{
                              resources {
                                id
                                name
                              }
                            }`,
                    };
                    xhr.responseType = 'json';
                    xhr.open('POST', API_URL);
                    const token = localStorage.getItem('msal.idtoken');
                    // Apollo client doesn't intercept the request, so it has to be built 'manually'
                    xhr.setRequestHeader('Authorization', `Bearer ${token}`);
                    xhr.setRequestHeader('Content-Type', 'application/json');
                    xhr.onload = () => {
                        const serverRes = xhr.response.data.resources;
                        const res: any[] = [];
                        res.push({ value: null });
                        for (const item of serverRes) {
                            res.push({ value: item.id, text: item.name });
                        }
                        choicesCallback(res);
                    };
                    xhr.send(JSON.stringify(query));
                },
            });
            Survey.Serializer.addProperty('resources', {
                name: 'displayField',
                category: 'Custom Questions',
                dependsOn: 'resource',
                required: true,
                visibleIf: (obj: any) => {
                    if (!obj || !obj.resource) {
                        return false;
                    } else {
                        return true;
                    }
                },
                visibleIndex: 3,
                choices: (obj: any, choicesCallback: any) => {
                    if (obj.resource) {
                        const xhr = new XMLHttpRequest();
                        const query = {
                            query: `
                                    query GetResourceById($id: ID!) {
                                      resource(id: $id) {
                                          id
                                          name
                                          fields
                                        }
                                    }`,
                            variables: {
                                id: obj.resource,
                            },
                        };
                        xhr.responseType = 'json';
                        xhr.open('POST', API_URL);
                        const token = localStorage.getItem('msal.idtoken');
                        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
                        xhr.setRequestHeader('Content-Type', 'application/json');
                        xhr.onload = () => {
                            const serverRes = xhr.response.data.resource.fields;
                            const res: any[] = [];
                            res.push({ value: null });
                            for (const item of serverRes) {
                                res.push({ value: item.name });
                            }
                            choicesCallback(res);
                        };
                        xhr.send(JSON.stringify(query));
                    }
                },
            });
            Survey.Serializer.addProperty('resources', {
                name: 'test service',
                category: 'Custom Questions',
                dependsOn: ['resource', 'displayField'],
                required: true,
                visibleIf: (obj: any) => {
                    if (!obj || !obj.resource || !obj.displayField) {
                        return false;
                    } else {
                        return true;
                    }
                },
                visibleIndex: 3,
                choices: (obj: any, choicesCallback: any) => {
                    if (obj.resource) {
                        const xhr = new XMLHttpRequest();
                        const query = {
                            query: `
                                    query GetResourceById($id: ID!) {
                                      resource(id: $id) {
                                          id
                                          name
                                          records {
                                              id
                                              data
                                          }
                                        }
                                    }`,
                            variables: {
                                id: obj.resource,
                            },
                        };
                        xhr.responseType = 'json';
                        xhr.open('POST', API_URL);
                        const token = localStorage.getItem('msal.idtoken');
                        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
                        xhr.setRequestHeader('Content-Type', 'application/json');
                        xhr.onload = () => {
                            const serverRes = xhr.response.data.resource.records;
                            const res: any[] = [];
                            res.push({ value: null });
                            for (const item of serverRes) {
                                res.push({ value: item.id, text: item.data[obj.displayField] });
                            }
                            choicesCallback(res);
                        };
                        xhr.send(JSON.stringify(query));
                    }
                },
            });
            Survey.Serializer.addProperty('resources', {
                name: 'canAddNew:boolean',
                category: 'Custom Questions',
                dependsOn: ['resource'],
                visibleIf: (obj: any) => {
                    if (!obj || !obj.resource) {
                        return false;
                    } else {
                        return true;
                    }
                },
                visibleIndex: 3,
            });
            Survey.Serializer.addProperty('resources', {
                name: 'addTemplate',
                category: 'Custom Questions',
                dependsOn: 'canAddNew',
                visibleIf: (obj: any) => {
                    if (!obj || !obj.canAddNew) {
                        return false;
                    } else {
                        return true;
                    }
                },
                visibleIndex: 3,
                choices: (obj: any, choicesCallback: any) => {
                    if (obj.resource && obj.canAddNew) {
                        const xhr = new XMLHttpRequest();
                        const query = {
                            query: `
                                    query GetResourceById($id: ID!) {
                                      resource(id: $id) {
                                          id
                                          name
                                          forms {
                                              id
                                              name
                                          }
                                        }
                                    }`,
                            variables: {
                                id: obj.resource,
                            },
                        };
                        xhr.responseType = 'json';
                        xhr.open('POST', API_URL);
                        const token = localStorage.getItem('msal.idtoken');
                        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
                        xhr.setRequestHeader('Content-Type', 'application/json');
                        xhr.onload = () => {
                            const serverRes = xhr.response.data.resource.forms;
                            const res: any[] = [];
                            res.push({ value: null });
                            for (const item of serverRes) {
                                res.push({ value: item.id, text: item.name });
                            }
                            choicesCallback(res);
                        };
                        xhr.send(JSON.stringify(query));
                    }
                },
            });
        },
        onLoaded(question: any): void {
            const xhr = new XMLHttpRequest();
            const query = {
                query: `query GetResourceById($id: ID!) {
                      resource(id: $id) {
                          id
                          name
                          records {
                              id
                              data
                          }
                      }
                  }`,
                variables: {
                    id: question.resource,
                },
            };
            xhr.responseType = 'json';
            xhr.open('POST', API_URL);
            const token = localStorage.getItem('msal.idtoken');
            xhr.setRequestHeader('Authorization', `Bearer ${token}`);
            xhr.setRequestHeader('Content-Type', 'application/json');
            xhr.onload = () => {
                const serverRes = xhr.response.data.resource.records;
                const res: any[] = [];
                for (const item of serverRes) {
                    res.push({ value: item.id, text: item.data[question.displayField] });
                }
                // question.choices = res;
                question.contentQuestion.choices = res;
                question.survey.render();
            };
            xhr.send(JSON.stringify(query));
        },
        onAfterRender(question: any, el: any): void {
            if (question.canAddNew && question.addTemplate) {
                document.addEventListener('saveResourceFromEmbed', (e: any) => {
                    const detail = e.detail;
                    if (detail.template === question.addTemplate) {
                        const xhr = new XMLHttpRequest();
                        const query = {
                            query: `query GetResourceById($id: ID!) {
                                  resource(id: $id) {
                                      id
                                      name
                                      records {
                                          id
                                          data
                                      }
                                  }
                              }`,
                            variables: {
                                id: question.resource,
                            },
                        };
                        xhr.responseType = 'json';
                        xhr.open('POST', API_URL);
                        const token = localStorage.getItem('msal.idtoken');
                        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
                        xhr.setRequestHeader('Content-Type', 'application/json');
                        xhr.onload = () => {
                            const serverRes = xhr.response.data.resource.records;
                            const res: any[] = [];
                            for (const item of serverRes) {
                                res.push({
                                    value: item.id,
                                    text: item.data[question.displayField],
                                });
                            }
                            question.contentQuestion.choices = res;
                            question.survey.render();
                        };
                        xhr.send(JSON.stringify(query));
                    }
                });
            }
        },
    };
    Survey.ComponentCollection.Instance.add(component);
    const widget = {
        name: 'addResource',
        isFit: (question: any) => {
            if (question.getType() === 'resources') {
                return question.canAddNew && question.addTemplate;
            } else {
                return false;
            }
        },
        isDefaultRender: true,
        afterRender: (question: any, el: any) => {
            const mainDiv = document.createElement('div');
            const btnEl = document.createElement('button');
            btnEl.innerText = 'Add';
            btnEl.style.width = '120px';
            btnEl.onclick = () => {
                const event = new CustomEvent('openForm', {
                    detail: { template: question.addTemplate },
                });
                document.dispatchEvent(event);
            };
            mainDiv.appendChild(btnEl);
            el.parentElement.insertBefore(mainDiv, el);
        },
    };
    Survey.CustomWidgetCollection.Instance.add(widget);
}
