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
            'span', 'ul', 'li', 'img', 'svg', 'canvas', 'label', 'form', 'button'
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

        const start = ({reducer, root, attach}) => {
            const initialState = {};
            const store$ = action$
              .pipe(
                scan(reducer, initialState)
              );

            render(
                Connector({ observable$: store$, render: root }),
                attach
            );
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

        function start({ sidebarDef }){
            const getRoot = (components, dispatcher) => {
                const { div, textarea, h4, label, fragment, form, span, button } = components;
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

                function scrollChildren(){
                    const children = [];
                    sidebarDef.sections.forEach((section, i) => {
                        const child = div({ key: `${section.name}-divider-${i}`,className: 'divider'}, section.name);
                        children.push(child);
                        section.items.forEach((item, j) => {
                            //NOTE: child items should be added conditionally
                            // for example, buttons should not have label
                            var childItem;
                            if(!['button'].includes(item.type)){
                                childItem = div({ key: `${section.name}-${item.name}-${j}`}, [
                                    span({ key: `${section.name}-${item.name}-${j}-span`, className: 'label' }, item.name)
                                ]);
                            }
                            if(['button'].includes(item.type)){
                                childItem = div({ key: `${section.name}-${item.name}-${j}`,
                                    className: 'buttonContainer'
                                }, [
                                    button({ key: `${section.name}-${item.name}-${j}-span`,
                                        onClick: item.onClick || (() => {})
                                    }, item.name)
                                ]);
                            }
                            if(childItem) children.push(childItem);
                        });
                    });
                    return children;
                }

                const root = ({ pinned = sidebarDef.pinned, hidden = sidebarDef.hidden }) =>
                fragment([
                    div({id: 'header', key: 'header'}, [
                        span({ key: 'headerText'}, sidebarDef.title),
                        span({ key: "pinButton", id: "pinButton", onClick: () => pinClick(pinned)}, pinned ? 'UN-PIN' : 'PIN'),
                        span({ key: "closeSettings", id: "closeSettings", onClick: !pinned ? toggleClick : undefined, disabled: pinned }, '→')
                    ]),
                    div({className: 'scrollContainer', key: 'scrollContainer'}, scrollChildren())
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
                });
            }

            return rxReact.init(rxReactReady);
        }

        return callback(null, { start });
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
