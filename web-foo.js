(function(){
    /*
        Things which will find their way here:
            - github pages script
            - canvas setup and manipulation script
            - neural net setup script
            - misc utils like: clone, fetch wrapped (probably a bunch of other things done better elsewhere)

        Motivation:
            - I don't need a large lib or build system setup (for the following)
            - I don't want to set up a server (for the following)
            - I like to do react / redux / rx with just a few files
            - I like to do simple graphic experiments (canvas, d3, )
            - I like to do neural networks in the browser
            - there are things I do (like clone and fetching) which are lacking in js

        How this works (or should work):
            - one script tag for lib (this one) at top of html file (maybe another for page js)
            - this script will fetch other scripts when told to set up a particular context or use-case
            - refer to docs for context / use case
    */

    // cache script, https://github.com/webpgr/cached-webpgr.js
    // also see: https://addyosmani.com/basket.js/
    // maybe use service worker instead
    function cacheOrLoadify(script, scriptUrl, res){

        var content = localStorage.getItem(scriptUrl);

        if(!content){
            script.src = scriptUrl;
            script.onload = function (){
                /*
                    TODO: this is where to save cache
                    and will probably not work unless loading script source manually
                    which introduces other issues (CORS)
                    which will have to deal with by copying from CDN
                    bleh.... (disabled for now)

                    would also be cool if download parallel but append via waterfall
                */
                res.apply(null, arguments);
            }
            return script;
        }

        var c = JSON.parse(content);
        var scriptContent = document.createTextNode(c.content);
        script.appendChild(scriptContent);
        script.onload = res;
    }


    function loadScript(scriptUrl){
        const loadPromise = new Promise(function (res, rej) {
            let script = document.createElement('script');
            script.type = 'text/javascript';
            script = cacheOrLoadify(script, scriptUrl, res);
            script.onError = rej;
            script.async = true;
            script.addEventListener('error',rej);
            script.addEventListener('load',res);
            document.head.appendChild(script);
        });
        return loadPromise;
    }

    // https://remysharp.com/2015/12/18/promise-waterfall
    function waterfall(fn, arr){
        if(!fn || typeof fn !== 'function'
            || !arr || typeof arr !== "object" || !arr.length
        ){
            throw('Error with promise waterfall');
            return;
        }
        var promises = arr.reduce((all, one) => {
            return all
                .then((res) => {
                    return fn(one)
                        .then((result) => {
                            res.push(result);
                            return res;
                        });
                });
          }, Promise.resolve([]));
        return promises;
    }



    function consoleOrCallback(callback){
        if(callback && typeof callback === 'function'){
            return callback;
        }
        return (error, data) => {
            if (error){
                console.error(error);
                return;
            }
            if (data){
                console.log(data);
            }
        }
    }

    const isInitedFactory = function(parent, callback){
        const cb = consoleOrCallback(callback);
        if(parent.isInited){
            cb(`${parent.name}: script already inited!`);
        }
        var scripts = parent.scripts || [];
        var tasks = scripts.map(s => {
            return typeof s === "string"
                ? loadScript(s)
                : waterfall(loadScript, s)
        });
        Promise.all(tasks)
            .then(() => {
                parent.isInited = true;
                if(parent.scriptsAfter){
                    parent.scriptsAfter(cb);
                    return;
                }
                cb(null, `${parent.name}: script is inited!`);
            })
            .catch(e => cb(e));
    }

    const returnProps = function(o){
        return Object.keys(o).reduce((all, key) => {
            all[key] = o[key];
            return all;
        }, {})
    }

    // GITHUBPAGES -------------------------------------------------------------
    function githubPages(){ return returnProps(githubPages); }
    githubPages.scripts = [
        'https://crosshj.com/experiments/ghPageHelper.js'
    ];
    githubPages.init = callback => isInitedFactory(githubPages, callback);



    // RXREACT -----------------------------------------------------------------
    function rxReact(){ return returnProps(rxReact); }
    rxReact.scripts = [
        'https://unpkg.com/rxjs@beta/bundles/rxjs.umd.js',
        [    // react and react-dom should waterfall
            'https://unpkg.com/react@16/umd/react.development.js',
            'https://unpkg.com/react-dom@16/umd/react-dom.development.js'
        ]
    ];

    rxReact.scriptsAfter = (callback) => {
        const { of, fromEvent, from, range } = rxjs;
        const { Observable, Subject } = rxjs;
        const { map, filter, startWith, scan } = rxjs.operators;
        const { render } = ReactDOM;
        const { createElement, Component } = React;

        //TODO: would be nice t integrate with redux dev tools!

        const components = {
            fragment: children => createElement(React.Fragment, null, children)
        };
        [
            'div', 'textarea', 'input', 'h1', 'h2', 'h3', 'h4', 'h5', 'p',
            'span', 'ul', 'li', 'img', 'svg', 'canvas', 'label', 'form', 'button',
            'select', 'option'
        ].forEach(el => {
            components[el] = (props, children) => createElement(el, props, children);
        });

        const action$ = new Subject();
        const dispatcher = function(action){
          return action$.next(action);
        }

        function RXConnector(props) {
            this.state = {};
            this.render = () => {
                return components.fragment(props.render(this.state));
            };
            this.observable$ = props.observable$;
            this.componentWillMount = function(){
                this.observable$.subscribe(o => {
                this.setState(o)
                });
            }
        }
        RXConnector.prototype = Object.create(Component.prototype);
        const Connector = (props, children) => createElement(RXConnector, props, children);

        const start = ({reducer, root, attach}, reactStartCallback) => {
            const initialState = {};
            const store$ = action$
              .pipe(
                scan(reducer, initialState)
              );

            render(
                Connector({ observable$: store$, render: root }),
                attach
            );
            reactStartCallback();
        };

        if( !components || !dispatcher || !start || !React || !rxjs){
            callback(`rxReact missing one of: { components, dispatcher, start, React, rxjs }!`);
            return;
        }
        callback(null, { components, dispatcher, start, React, rxjs });
    };
    rxReact.init = callback => isInitedFactory(rxReact, callback);



    // CANVAS ------------------------------------------------------------------
    function canvas(){ return returnProps(canvas); }
    canvas.scripts = [
        'https://crosshj.com/sandbox/canvas_plus.js'
    ];
    canvas.scriptsAfter = (callback) => {
        const start = (options) => {
            var cv = new CanvasPlus(options);
            cv.start();
            return cv;
        };
        return callback(null, { start });
    };
    canvas.init = callback => isInitedFactory(canvas, callback);


    // SIDEBAR ------------------------------------------------------------------
    function sidebar(){ return returnProps(sidebar); }
    sidebar.scripts = [];
    sidebar.scriptsAfter = (callback) => {
        // load react, use to create menu
        const clone = o => {
            const result = undefined;
            try { result = JSON.parse(JSON.stringify(o)); }
            catch(e) {}
            return result;
        };

        function sidebarStart({ sidebarDef }, startCallback){
            const getRoot = (components, dispatcher) => {
                const {
                    div, textarea, h4, label, fragment, form, span, button,
                    input, select, option, ul, li
                } = components;
                const action = (type) => (e) => dispatcher({type, payload: e.target.value});

                const pinClick = (pinned) => dispatcher({
                    type: 'PIN_CHANGED',
                    payload: !pinned
                });

                const toggleClick = () => {
                    const hidden = document.getElementById('sidebar').style.display === 'none';
                    document.getElementById('sidebar').style.display = hidden ? 'block' : 'none';

                    var opener = document.getElementById('openSettings');
                    if(!opener){
                        opener = document.createElement('div');
                        opener.id = 'openSettings';
                        opener.onclick = toggleClick;
                        opener.innerText = '←';
                        document.body.appendChild(opener);
                    }
                    opener.style.display = !hidden ? 'block' : 'none';

                    return dispatcher({
                        type: 'HIDDEN_CHANGED',
                        payload: !hidden
                    })
                };

                if(sidebarDef.hidden){
                    // NOTE: is this safe since dispatcher called?
                    toggleClick();
                }

                if(sidebarDef.pinned && sidebarDef.pinHandler){
                    sidebarDef.pinHandler({ pinned: true });
                }

                function textComponent({div, span, section, item, index }){
                    return (
                        div({ key: `${section.name}-${item.name}-${index}`}, [
                            span({ key: `${section.name}-${item.name}-${index}-span`, className: 'label' }, item.name),
                            input({
                                key: `${section.name}-${item.name}-${index}-input`,
                                type:'text',
                                defaultValue: item.default,
                                onChange: e => console.log(`TODO: should update reducer state!`) & item.onChange(e),
                                onFocus: e => e.target.select()
                            })
                        ])
                    );
                }

                function sliderComponent({ span, div, input, section, item, index }){
                    return (
                        div({ key: `${section.name}-${item.name}-${index}`}, [
                            span({ key: `${section.name}-${item.name}-${index}-span`, className: 'label' }, item.name),
                            div({ key: `${section.name}-${item.name}-${index}-div`, className: 'sliderValue' }, item.default),
                            input({
                                key: `${section.name}-${item.name}-${index}-input`,
                                type: 'range',
                                min: item.min,
                                max: item.max,
                                step: item.step,
                                defaultValue: item.default,
                                //tabIndex: 0,
                                onChange: e => console.log(`TODO: should update sliderValue div TRUE|FALSE`) & item.onChange(e)
                            })
                        ])
                    );
                }

                function booleanComponent({ div, span, label, input, section, item, index }){
                    return (
                        div({ key: `${section.name}-${item.name}-${index}`}, [
                            span({ key: `${section.name}-${item.name}-${index}-span`, className: 'label' }, item.name),
                            div({ key: `${section.name}-${item.name}-${index}-div`, className: 'booleanValue' }, item.default),
                            label({key: `${section.name}-${item.name}-${index}-label`, className: 'switch'}, [
                                input({
                                    key: `${section.name}-${item.name}-${index}-label-input`,
                                    type:"checkbox",
                                    onChange: e => console.log(`TODO: should update booleanValue div TRUE|FALSE`) & item.onChange({ target: { value: e.target.checked }})
                                }),
                                span({
                                    key: `${section.name}-${item.name}-${index}-label-span`,
                                    className: "slider",
                                    tabIndex: 0
                                })
                            ])
                        ])
                    );
                }

                function buttonComponent({ div, button, section, item, index }){
                    return (
                        div({ key: `${section.name}-${item.name}-${index}`,
                            className: 'buttonContainer'
                        }, [
                            button({ key: `${section.name}-${item.name}-${index}-span`,
                                onClick: item.onClick || (() => {})
                            }, item.name)
                        ])
                    );
                }

                function selectComponent({ div, span, select, option, section, item, index}){
                    return (
                        div({ key: `${section.name}-${item.name}-${index}`}, [
                            span({ key: `${section.name}-${item.name}-${index}-span`, className: 'label' }, item.name),
                            select({
                                key: `${section.name}-${item.name}-${index}-select`,
                                defaultValue: item.default,
                                onChange: e => console.log(`TODO: should update reducer state!`) & item.onChange(e.target.value)
                            },
                                item.options.map((opt, i) => 
                                    option(
                                        { key: `${section.name}-${item.name}-${index}-option${i}`},
                                        opt
                                    )
                                )
                            )
                        ])
                    );
                }

                function layersComponent({ div, span, section, item, index}){
                    return (
                        div({
                            key: `${section.name}-${item.name}-${index}`,
                            className: 'layers'
                        }, [
                            span({
                                key: `${section.name}-${item.name}-${index}-span`,
                                className: 'label'
                            }, item.name),
                            div({
                                key: `${section.name}-${item.name}-${index}-div`,
                                className: 'layerTools'
                            }, [
                                select({
                                    key: `${section.name}-${item.name}-${index}-select`
                                }, [
                                    option({
                                        key: `${section.name}-${item.name}-${index}-li-normal`
                                    }, 'Normal'),
                                    option({
                                        key: `${section.name}-${item.name}-${index}-li-darken`
                                    }, 'Darken'),
                                    option({
                                        key: `${section.name}-${item.name}-${index}-ul-lighten`
                                    }, 'Lighten'),
                                    option({
                                        key: `${section.name}-${item.name}-${index}-ul-burn`
                                    }, 'Burn')
                                ]),
                                input({
                                    key: `${section.name}-${item.name}-${index}-input`,
                                    type:"range", min:"0", max:"100", step:"5", 
                                    defaultValue: 100
                                })
                            ]),
                            ul({
                                key: `${section.name}-${item.name}-${index}-ul`
                            }, [
                                li({
                                    tabIndex: 0
                                }, [
                                    input({ type:"checkbox", defaultChecked: true}),
                                    div({ className: "image"}),
                                    span({ className: "label"}, 'Layer 1')
                                ]),
                                li({
                                    tabIndex: 0
                                }, [
                                    input({ type:"checkbox", defaultChecked: true}),
                                    div({ className: "image"}),
                                    span({ className: "label"}, 'Layer 2')
                                ])
                            ])
                        ])
                    );
                }

                function dividerComponent({ div, section, index }){
                    return (
                        div({ key: `${section.name}-divider-${index}`,className: 'divider'}, section.name)
                    );
                }

                //TODO: all events should be tracked by reducer!

                const root = ({ pinned = sidebarDef.pinned, hidden = sidebarDef.hidden }) =>
                fragment([
                    div({id: 'header', key: 'header'}, [
                        span({ key: 'headerText'}, sidebarDef.title),
                        span({ key: "pinButton", id: "pinButton", onClick: () => pinClick(pinned)}, pinned ? 'UN-PIN' : 'PIN'),
                        span({ key: "closeSettings", id: "closeSettings", onClick: !pinned ? toggleClick : undefined, disabled: pinned }, '→')
                    ]),
                    div({className: 'scrollContainer', key: 'scrollContainer'},
                        sidebarDef.sections.reduce((all, section, i) => {
                            all.push(dividerComponent({ div, section, index: i }));
                            const sectionItems = section.items
                                .map((item, j) => {
                                    return ({
                                        text: () => textComponent({div, span, section, item, index: j}),
                                        slider: () => sliderComponent({ span, div, input, section, item, index: j }),
                                        boolean: () => booleanComponent({ div, span, label, input, section, item, index: j }),
                                        button: () => buttonComponent({ div, button, section, item, index: j }),
                                        select: () => selectComponent({ div, span, select, option, section, item, index: j}),
                                        layers: () => layersComponent({ div, span, section, item, index: j})
                                    })[item.type];
                                })
                                .forEach(component => all.push(component()));
                            return all;
                        }, [])
                    )
                ]);

                return root;
            }
            
            // reducer should be built with respect to sidebar definition
            const getReducer = () => {
                const reducer = (state, action) => {
                    var newState = clone(state);
                    switch(action.type){
                        case 'PIN_CHANGED': {
                            if(sidebarDef.pinHandler){
                                sidebarDef.pinHandler({ pinned: action.payload });
                            }
                            newState = Object.assign({}, state, { pinned: action.payload });
                            break;
                        }
                        case 'HIDDEN_CHANGED': {
                            newState = Object.assign({}, state, { hidden: action.payload });
                            break;
                        }
                    }
                    return newState;
                };
                return reducer;
            };
            
            function rxReactReady(err, { components, dispatcher, start, React } = {}){
                if(err){
                    console.error(`Error in rxReactReady: ${err}`)
                    return;
                }

                //TODO: insert css

                const sidebarRoot = document.createElement("div");
                sidebarRoot.id = 'sidebar';
                document.body.appendChild(sidebarRoot);
                start({
                    reducer: getReducer(),
                    root: getRoot(components, dispatcher),
                    attach: sidebarRoot
                }, startCallback);
            }

            return rxReact.init(rxReactReady);
        }

        return callback(null, { start: sidebarStart });
    };
    sidebar.init = callback => isInitedFactory(sidebar, callback);


    // NEURAL ------------------------------------------------------------------
    function neural(){ return returnProps(neural); }
    neural.scripts = [
        'https://cdnjs.cloudflare.com/ajax/libs/synaptic/1.0.10/synaptic.js'
    ];
    // TODO: include helpers that set everything up except the basic needs
    neural.init = callback => isInitedFactory(neural, callback);


    // UTILS -------------------------------------------------------------------
    function utils(){ return returnProps(utils); }
    // TODO: create utils script and host on github
    // TODO: include helpers that set everything up except the basic needs
    utils.init = callback => isInitedFactory(utils, callback);



    // TODO: there should be a way of loading multiple contexts / modules

    window.footils = {
        githubPages,
        rxReact,
        canvas,
        sidebar,
        neural,
        utils
    };
})();
