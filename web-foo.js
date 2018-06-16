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


    /* Layers: handle reorder
        - TODO: still some issues with mobile drag and drop

        references:
            https://forums.adobe.com/thread/1598080
            https://www.youtube.com/watch?v=v96u1srGg1w

    */

   function addCssLink({ id, href }){
        if (document.getElementById(id)){
            return;
        }
        var head  = document.getElementsByTagName('head')[0];
        var link  = document.createElement('link');
        link.id   = id;
        link.rel  = 'stylesheet';
        link.type = 'text/css';
        link.href = href;
        link.media = 'all';
        head.appendChild(link);
    }

    function appendCss(cssToAppend){
        const layersUrl = './css/sidebar.css';
        const appendIncludesSidebar = () => Array.isArray(cssToAppend) && cssToAppend.includes('sidebar')
        if(cssToAppend === 'sidebar' || appendIncludesSidebar()){
            addCssLink({
                id: 'sidebarCSS',
                href: '../css/sidebar.css'
            });
        }
    }

    function isNumeric(n) {
        return !isNaN(parseFloat(n)) && isFinite(n);
    }

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
        'https://cdnjs.cloudflare.com/ajax/libs/rxjs/6.2.0/rxjs.umd.min.js',
        //'https://unpkg.com/rxjs@beta/bundles/rxjs.umd.js',
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
            'span', 'ul', 'li', 'img', 'canvas', 'label', 'form', 'button',
            'select', 'option', 'svg', 'g', 'path', 'circle', 'rect', 'polygon'
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

        const start = ({reducer, root, attach, initialState = {}}, reactStartCallback) => {
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
            var result = undefined;
            try { result = JSON.parse(JSON.stringify(o)); }
            catch(e) {
                console.error('Some problem cloning!', e);
            }
            return result;
        };

        function sidebarStart({ sidebarDef }, startCallback){
            const getRoot = (components, dispatcher) => {
                const {
                    div, textarea, h4, label, fragment, form, span, button,
                    input, select, option, ul, li, svg, g, path, circle, rect, polygon,
                    img
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

                const layerVisibleClick = (layerNumber) => {
                    return dispatcher({
                        type: 'LAYER_VISIBILE_TOGGLED',
                        payload: layerNumber
                    });
                };

                const layerSelectedChanged = (layerNumber) => {
                    return dispatcher({
                        type: 'LAYER_SELECTION_CHANGED',
                        payload: layerNumber
                    });
                };

                const layersPropertiesChanged = ({ alpha, blend}) => {
                    return dispatcher({
                        type: 'LAYERS_PROPERTIES_CHANGE',
                        payload: { alpha, blend }
                    });
                };

                const setGlobalState = ({ key, value }) => {
                    return dispatcher({
                        type: 'SET_GLOBAL_STATE',
                        payload: { key, value }
                    });
                };

                const reorderLayers = (order) => {
                    return dispatcher({
                        type: 'REORDER_LAYERS',
                        payload: { order }
                    });
                };

                const addLayerItem = (payload) => {
                    return dispatcher({
                        type: 'ADD_LAYER_ITEM',
                        payload
                    })
                };

                const removeLayers = (payload) => {
                    return dispatcher({
                        type: 'REMOVE_LAYERS',
                        payload
                    });
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

                function sliderComponent({ span, div, input, section, item, index,
                    showLabel=true, globalState=[]
                }){

                    const keyBase = `${section.name}-${item.name}-${index}-slider`;
                    const currentValue = (globalState.find(x => x.key === keyBase) || {}).value;
                    const value = currentValue || item.default;
                    const leftOffset = showLabel ? '90px' : '0px';
                    const rightOffset = showLabel ? '5px' : '0px';

                    const touchend = e => {
                        item.onChange({ value: e.target.value, key: keyBase });
                    };
                    return (
                        div({
                            key: `${keyBase}`,
                            className: 'slider-component'
                        }, [
                            showLabel
                                ? span({
                                    key: `${keyBase}-span`,
                                    className: 'label'
                                }, item.name)
                                : undefined,
                            div({
                                key: `${keyBase}-div`,
                                className: 'sliderValue', style: {
                                    left: value < 50 ? 'unset' : leftOffset,
                                    right: value < 50 ? rightOffset : 'unset'
                                }
                            }, value),
                            input({
                                key: `${keyBase}-input`,
                                type: 'range',
                                min: item.min,
                                max: item.max,
                                step: item.step,
                                value,
                                //tabIndex: 0,
                                onChange: (e) => setGlobalState({ key: keyBase, value: e.target.value }),
                                onMouseUp: (e) => { setGlobalState({ key: keyBase, value: e.target.value }); touchend(e); },
                                onTouchEnd: touchend
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
                                    onChange: e => console.log(`TODO: should update booleanValue div (label TRUE|FALSE)`) & item.onChange({ target: { value: e.target.checked }})
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
                            button({ key: `${section.name}-${item.name}-${index}-button`,
                                onClick: item.onClick || (() => {})
                            }, item.name)
                        ])
                    );
                }

                function selectComponent({ div, span, select, option, section, item, index, showLabel=true, globalState=[] }){
                    const key = `${section.name}-${item.name}-${index}-select`;
                    const currentValue = (globalState.find(x => x.key === key) || {}).value;
                    const value = currentValue || item.default;

                    return (
                        div({
                            key,
                            className: 'select-component'
                        }, [
                            showLabel
                                ? span({ key: `${key}-span`, className: 'label' }, item.name)
                                : undefined,
                            select({
                                key: `${key}-select`,
                                disabled: item.disabled,
                                value,
                                onChange: e => {
                                    setGlobalState({ key, value: e.target.value });
                                    item.onChange({ key, value: e.target.value });
                                },
                            },
                                item.options.map((opt, i) => 
                                    option(
                                        { key: `${key}-option${i}`},
                                        opt
                                    )
                                )
                            )
                        ])
                    );
                }

                function eyeToggle({ key, svg, g, path, circle, hidden, layerClick }){
                    return (
                        svg({
                            key,
                            xmlns:"http://www.w3.org/2000/svg",
                            xmlnsXlink: "http://www.w3.org/1999/xlink",
                            version: "1.1",
                            viewBox: "0 0 512 512",
                            preserveAspectRatio: "none",
                            className: "eyeToggle",
                            // tabIndex: 0,
                            onClick: layerClick
                        },
                            g(null, [
                                path({
                                    key: `${key}-g-path`,
                                    d: "m34,256l26.2,26.2c108,108 283.7,108 391.7,0l26.1-26.2-26.2-26.2c-108-108-283.7-108-391.7,0l-26.1,26.2zm222,126.2c-75.8,0-151.6-28.9-209.3-86.6l-32.9-32.9c-3.7-3.7-3.7-9.7 0-13.5l32.9-32.9c115.4-115.4 303.2-115.4 418.6,0l32.9,32.9c3.7,3.7 3.7,9.7 0,13.5l-32.9,32.9c-57.7,57.7-133.5,86.6-209.3,86.6z"
                                }),
                                circle({
                                    key: `${key}-g-circle`,
                                    cx:"256", cy: "256", r: "80"
                                }),
                                hidden
                                    ? path({
                                        key: `${key}-g-path-2`,
                                        d: "M 400 52 L 460 52 L 160 460 L 100 460 Z"
                                    })
                                    : null
                            ])
                        )
                    );
                }

                function editIcon({ key, svg, g, rect, polygon, editClick}){
                    // const pencilStyle = {
                    //     highlight: "#C4C8F5",
                    //     shadow: "#A7ADF0",
                    //     tip: "#FFB655",
                    //     eraserHighlight: "#1E81CE",
                    //     eraserShadow: "#165C92"
                    // }
                    const pencilStyle = {
                        shadow: "rgba(140, 140, 140, 1)",
                        tip: "rgba(255, 255, 255, .6)",
                        eraserShadow: "rgba(0, 0, 0, .7)"
                    }
                    return (
                        div({
                            key,
                            className: 'buttonContainer editIcon'
                        },
                            div(null,
                                svg({
                                    xmlns:"http://www.w3.org/2000/svg",
                                    xmlnsXlink: "http://www.w3.org/1999/xlink",
                                    version: "1.1",
                                    viewBox: "0 0 504.034 504.034",
                                    preserveAspectRatio: "none",
                                    // tabIndex: 0,
                                    onClick: editClick
                                },
                                    g(null, [
                                        rect({
                                            key: `${key}-g-rect`,
                                            style: { fill: pencilStyle.shadow },
                                            //style: { fill: pencilStyle.highlight},
                                            x: "169.782", y: "41.048",
                                            transform: "matrix(0.7071 0.7071 -0.7071 0.7071 224.208 -84.0257)",
                                            width: "87.5", height: "375.164"
                                        }),
                                        polygon({
                                            key: `${key}-g-polygon-1`,
                                            style: { fill: pencilStyle.shadow },
                                            points: "408.044,157.861 377.109,126.926 111.827,392.207 173.699,454.078 438.98,188.797"
                                        }),
                                        polygon({
                                            key: `${key}-g-polygon-2`,
                                            style: { fill: pencilStyle.tip },
                                            points: "49.956,330.335 0,504.034 173.699,454.078"
                                        }),
                                        polygon({
                                            key: `${key}-g-polygon-3`,
                                            style: { fill: pencilStyle.eraserShadow },
                                            //style: { fill: pencilStyle.eraserHighlight},
                                            points: "442.162,61.872 504.034,123.743 380.291,0 315.237,65.054 377.108,126.925"
                                        }),
                                        polygon({
                                            key: `${key}-g-polygon-4`,
                                            style: { fill: pencilStyle.eraserShadow },
                                            points: "442.162,61.872 377.108,126.925 408.044,157.861 438.98,188.797 504.034,123.743"
                                        })
                                    ])
                                )
                            )
                        )
                    );
                }

                function layersComponent({ div, span, section, item, img,
                    index, layersHidden, layersSelected, globalState, layerOrder
                }){
                    if (!layersHidden){
                        layersHidden = item.layersHidden;
                    }
                    const layerDropZone = (number) => li({
                        key: `layer-drop-zone-${number}}`,
                        className: 'layer-drop',
                        style: { display: 'none' }
                    });

                    const handleReOrder = ({ item, layers, draggedItem, dropTarget}) => {
                        var order = layers.map((x,i) => isNumeric(x.number) ? x.number : i);
                        const actualDragged = draggedItem;
                        const draggedPosition = layers.map(x => x.number).indexOf(actualDragged);
                        const droppedPosition = Number(dropTarget.replace('AFTER','').replace('BEFORE',''));
                        const actualDropped = layers[droppedPosition].number;
                        const layer = layers.find(x => x.number == draggedItem);

                        // console.log({
                        //     layers,
                        //     dropTarget,
                        //     draggedItem,
                        //     draggedPosition,
                        //     actualDragged,
                        //     actualDropped
                        // });

                        // MOVE TO TOP
                        if(dropTarget === 'BEFORE 0'){
                            order = [actualDragged].concat(order.filter(x => x !== actualDragged));
                            //console.log(`Dragged item ${actualDragged} to position BEFORE 0 (moveToTop)`);
                            layer.changeLayerOrder({
                                number: layer.number,
                                operation: 'moveToTop'
                            });
                            //console.log(`New order: ${order}`);
                            reorderLayers(order);
                            return;
                        }
                        // MOVE TO BOTTOM
                        if(dropTarget === `AFTER ${layers.length - 1}`){
                            order = order.filter(x => x !== actualDragged).concat([actualDragged])
                            //console.log(`Dragged item ${actualDragged} to position AFTER ${actualDropped} (moveToBottom)`);
                            layer.changeLayerOrder({
                                number: layer.number,
                                operation: 'moveToBottom'
                            });
                            //console.log(`New order: ${order}`);
                            reorderLayers(order);
                            return;
                        }

                        // MOVE UP
                        if(dropTarget === `AFTER ${draggedPosition - 2}`){
                            order = order.filter(x => x !== actualDragged);
                            order = order.reduce((all, x) => {
                                all.push(x);
                                if(x === actualDropped){
                                    all.push(actualDragged);
                                }
                                return all;
                            }, []);
                            //console.log(`Dragged item ${actualDragged} to position AFTER ${actualDropped} (moveUp)`);
                            layer.changeLayerOrder({
                                number: layer.number,
                                operation: 'moveUp'
                            });
                            //console.log(`New order: ${order}`);
                            reorderLayers(order);
                            return;
                        }

                        // MOVE DOWN
                        if(dropTarget === `AFTER ${draggedPosition + 1}`){
                            order = order.filter(x => x !== actualDragged);
                            order = order.reduce((all, x) => {
                                all.push(x);
                                if(x === actualDropped){
                                    all.push(actualDragged);
                                }
                                return all;
                            }, []);
                            //console.log(`Dragged item ${actualDragged} to position AFTER ${actualDropped} (moveDown)`);
                            layer.changeLayerOrder({
                                number: layer.number,
                                operation: 'moveDown'
                            });
                            //console.log(`New order: ${order}`);
                            reorderLayers(order);
                            return;
                        }
                        
                        // MOVE DOWN MULTIPLE TIMES
                        if(draggedPosition < droppedPosition){
                            order = order.filter(x => x !== actualDragged);
                            order = order.reduce((all, x, i) => {
                                all.push(x);
                                if(i === droppedPosition-1){
                                    all.push(actualDragged);
                                }
                                return all;
                            }, []);
                            //console.log(`Dragged item ${actualDragged} to position AFTER ${actualDropped} (moveDown X ${droppedPosition - draggedPosition})`);
                            layer.changeLayerOrder({
                                number: layer.number,
                                operation: 'moveDown',
                                repeat: droppedPosition - draggedPosition
                            });
                            //console.log(`New order: ${order}`);
                            reorderLayers(order);
                            return;
                        }

                        // MOVE UP MULTIPLE TIMES
                        if(draggedPosition > droppedPosition){
                            order = order.filter(x => x !== actualDragged);
                            order = order.reduce((all, x, i) => {
                                all.push(x);
                                if(i === droppedPosition){
                                    all.push(actualDragged);
                                }
                                return all;
                            }, []);
                            //console.log(`Dragged item ${actualDragged} to position AFTER ${actualDropped} (moveUp X ${draggedPosition - droppedPosition - 1})`);
                            layer.changeLayerOrder({
                                number: layer.number,
                                operation: 'moveUp',
                                repeat: draggedPosition - droppedPosition - 1
                            });
                            //console.log(`New order: ${order}`);
                            reorderLayers(order);
                            return;
                        }
                        //TODO: there are more situations to handle with larger amounts of layers
                        // multiple moveUp's and moveDown's?
                        console.warn(`UNHANDLED: Dragged item ${draggedItem} to position ${dropTarget}`);

                       window.enterTarget = null;
                       window.draggedIndex = null;
                       window.dropTarget = null;
                    };

                    function dragStartHandler(layersIndex, e){
                        //console.log(`started dragging ${layersIndex}`)

                        document.querySelector('.layers ul').classList.add('contains-dragging');
                        e.target.classList.add('dragging');
                        window.draggedIndex = layersIndex;
                        const hideDragGhost = true;
                        if(e.dataTransfer && hideDragGhost){
                            e.dataTransfer.dropEffect = 'none';
                            e.dataTransfer.effectAllowed = 'none';
                            var img = new Image(); 
                            img.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg"/>'; 
                            e.dataTransfer.setDragImage(img, 10, 10);
                        }
                    }

                    function dragEnterHandler(layersIndex, layers, e){
                        const realTarget = layers.map(x => x.number).indexOf(layersIndex);
                        const realDragged = layers.map(x => x.number).indexOf(window.draggedIndex);
                        if(e.target.tagName.toLowerCase() !== 'li'){
                            return false;
                        }
                        
                        if(realTarget === realDragged || window.enterTarget
                        ){
                            //window.enterTarget = null;
                            window.dropText = null;
                            return;
                        }

                        //console.log(`entered dragging ${e.target.id}`)
                        window.enterTarget = e.target;
                        if(realDragged > realTarget){
                            window.dropText = realTarget > 0
                                ? `AFTER ${realTarget-1}`
                                : `BEFORE 0`;
                            e.target.previousSibling.classList.add('active');
                        } else {
                            window.dropText = `AFTER ${realTarget}`;
                            e.target.nextSibling.classList.add('active');
                        }
                        e.stopPropagation();
                        e.preventDefault();
                        return false;
                    }

                    function dragLeaveHandler(layersIndex, e){
                        if(e.target.tagName.toLowerCase() !== 'li'
                        ){
                            return false;
                        }
                        if(e.pageX && e.pageY){
                            var newElement = document.elementFromPoint(e.pageX, e.pageY);
                            if((window.enterTarget && window.enterTarget.contains(newElement))){
                                return false;
                            }
                        }
                        //console.log(`left dragging ${e.target.id}`)
                        document.querySelectorAll('.layer-drop').forEach(node => node.classList.remove('active'))
                        window.enterTarget = null;
                        e.stopPropagation && e.stopPropagation();
                        e.preventDefault && e.preventDefault();
                        return false;
                    }

                    function dragEndHandler(layersIndex, layers, e){
                        document.querySelector('.contains-dragging')
                            .classList.remove('contains-dragging');
                        document.querySelectorAll('.dragging')
                            .forEach(node => node.classList.remove('dragging'))

                        if(!window.dropText){
                            window.enterTarget = null;
                            window.draggedIndex = null;
                            return false;
                        }
                        
                        document.querySelectorAll('.layer-drop').forEach(node => node.classList.remove('active'))
                        handleReOrder({
                            item, layers,
                            draggedItem: window.draggedIndex,
                            dropTarget: window.dropText
                        });
                        window.enterTarget = null;
                        window.draggedIndex = null;
                        e.stopPropagation();
                        e.preventDefault();
                        return false;
                    }

                    // TOUCH -> DRAG/DROP
                    // patterned off https://github.com/Bernardo-Castilho/dragdroptouch/blob/master/DragDropTouch.js
                    var dragTouchSource;
                    var enteredElement;
                    function touchStartHandler(layersIndex, e){
                        //console.log('touch start');
                        // TODO: only fire this event after big enough move in touchMove
                        dragStartHandler(layersIndex, e);
                        dragTouchSource = e.target;
                        //e.preventDefault();
                        e.stopPropagation();
                    }

                    function getPoint(e, page) {
                        if (e && e.touches) {
                            e = e.touches[0];
                        }
                        return { x: page ? e.pageX : e.clientX, y: page ? e.pageY : e.clientY };
                    }
                    function touchMoveHandler(layersIndex, layers, e){
                        const pt = getPoint(e);
                        const hoveredElement = document.elementFromPoint(pt.x, pt.y);
                        if(hoveredElement.classList.contains('dragging')){
                            if(enteredElement){
                                // trigger leave handler of previously entered element
                                var leaveEvent = document.createEvent('Event');
                                leaveEvent.initEvent('dragleave', true, true);
                                enteredElement.dispatchEvent(leaveEvent);
                                enteredElement = null;
                            }
                            //e.preventDefault();
                            e.stopPropagation();
                            return;
                        }
                        if(hoveredElement.tagName.toLowerCase() !== 'li'){
                            //e.preventDefault();
                            e.stopPropagation();
                            return false;
                        }
                        if(enteredElement && enteredElement.isEqualNode(hoveredElement)){
                            //e.preventDefault();
                            e.stopPropagation();
                            return;
                        }
                        //console.log('touch move', hoveredElement);
                        if(enteredElement){
                            // trigger leave handler of previously entered element
                            var leaveEvent = document.createEvent('Event');
                            leaveEvent.initEvent('dragleave', true, true);
                            enteredElement.dispatchEvent(leaveEvent);
                        }
                        enteredElement = hoveredElement;
                        
                        //trigger enter handler or new element
                        var enterEvent = document.createEvent('Event');
                        enterEvent.initEvent('dragenter', true, true);
                        enteredElement.dispatchEvent(enterEvent);
                        
                        //e.preventDefault();
                        e.stopPropagation();
                   }

                    function touchEndHandler(layersIndex, layers, e){
                        //console.log('touch end');
                        if(enteredElement){
                        var enterEvent = document.createEvent('Event');
                            enterEvent.initEvent('dragend', true, true);
                            dragTouchSource.dispatchEvent(enterEvent);
                        }
                        dragTouchSource = null;
                        enteredElement = null;
                    }

                    function touchCancelHandler(layersIndex, e){
                        //console.log('touch cancel');
                        if(enteredElement){
                            var enterEvent = document.createEvent('Event');
                                enterEvent.initEvent('dragend', true, true);
                                dragTouchSource.dispatchEvent(enterEvent);
                        }
                        dragTouchSource = null;
                        enteredElement = null;
                    }

                    function createElementFromHTML(htmlString) {
                        var div = document.createElement('div');
                        div.innerHTML = htmlString.trim();
                        
                        // Change this to div.childNodes to support multiple top-level nodes
                        return div.firstChild; 
                    }

                    function parseFunction(string){
                        var func = new Function("return " + string)();
                        return func;
                    }

                    function constructLayer(goFn, cancelFn){
                        const container = createElementFromHTML(`
                            <div id="layer-create">
                                <div id="topBar">
                                    <div>
                                        <label>Name</label>
                                        <input type="text" id="layerName" placeHolder="Enter Layer Name"/>
                                    </div>
                                    <div>
                                        <label>Type</label>
                                        <select id="layerType">
                                            <option>2D Canvas</option>
                                            <option>3D Canvas</option>
                                            <option>Image</option>
                                            <option>SVG</option>
                                        </select>
                                    </div>
                                </div>

                                <div class="tabBar"></div>

                                <textarea id="layerDef"
                                    autocomplete="off" autocorrect="off"
                                    autocapitalize="off" spellcheck="false"
                                ></textarea>
                                
                                <div id="bottomBar">
                                    <div class="buttonContainer">
                                        <button id="layerAddCancel">Cancel</button>
                                    </div>
                                    <div class="buttonContainer">
                                        <button id="layerAddSubmit">Add Layer</button>
                                    </div>
                                </div>
                            </div>
                        `);
                        const getChildId = container.querySelector;
                        
                        const layerName = container.querySelector('#layerName');
                        const layerType = container.querySelector('#layerType');
                        const layerDef = container.querySelector('#layerDef');
                        const layerAddCancel = container.querySelector('#layerAddCancel');
                        const layerAddSubmit = container.querySelector('#layerAddSubmit');
                        const tabBar = container.querySelector('.tabBar');

                        const smiley = [
                            "var centerX = width / 2;",
                            "var centerY = height / 2;",
                            "var radius = 70;",
                            "var eyeRadius = 10;",
                            "var eyeXOffset = 25;",
                            "var eyeYOffset = 20;",

                            "\n// face",
                            "ctx.beginPath();",
                            "ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI, false);",
                            "ctx.fillStyle = 'yellow';",
                            "ctx.fill();",
                            "ctx.lineWidth = 3;",
                            "ctx.strokeStyle = 'black';",
                            "ctx.stroke();",

                            "\n// eyes",
                            "ctx.beginPath();",
                            "var eyeX = centerX - eyeXOffset;",
                            "var eyeY = centerY - eyeXOffset;",
                            "ctx.arc(eyeX, eyeY, eyeRadius, 0, 2 * Math.PI, false);",
                            "var eyeX = centerX + eyeXOffset;",
                            "ctx.arc(eyeX, eyeY, eyeRadius, 0, 2 * Math.PI, false);",
                            "ctx.fillStyle = 'black';",
                            "ctx.fill();",

                            "\n// mouth",
                            "ctx.beginPath();",
                            "ctx.arc(centerX, centerY+7, 25, Math.PI, 2*Math.PI, false);",
                            "ctx.stroke();",
                        ].join('\n');

                        const colors = [
                            'red', 'orange', 'yellow', 'green', 'indigo', 'violet'
                        ];

                        const getNgonCode = (sides) => [
                            `const numberOfSides = ${sides};`,
                            "const size = 200;",
                            "Xcenter = width / 2;",
                            "Ycenter = height / 2",
                            `ctx.fillStyle = '${colors[Math.floor(Math.random()*colors.length)]}';`,

                            "\nctx.beginPath();",
                            "const rotateOffset = (numberOfSides % 2 ? 0.5 : 1) * Math.PI / numberOfSides;",
                            "ctx.moveTo (",
                            "   Xcenter +  size * Math.cos(0 + rotateOffset),",
                            "   Ycenter +  size *  Math.sin(0 + rotateOffset)",
                            ");",
                    
                            "\n(new Array(numberOfSides)).fill().forEach((x, i) => {",
                            "   j = i + 1;",
                            "   ctx.lineTo(",
                            "       Xcenter + size * Math.cos(j / numberOfSides * 2 * Math.PI + rotateOffset),",
                            "       Ycenter + size * Math.sin(j / numberOfSides * 2 * Math.PI + rotateOffset)",
                            "   );",
                            "});",
                            
                            "\nctx.fill();"
                        ].join('\n');

                        const triangle = getNgonCode(3);
                        const square = getNgonCode(4);
                        const octagon = getNgonCode(8);

                        const text = [
                            "const canvasText = 'hello sidebar';",
                            "ctx.font = 'bold 120px sans-serif';",
                            `ctx.fillStyle = '${colors[Math.floor(Math.random()*colors.length)]}';`,
                            "ctx.fillText(canvasText, 20, height/2, width);"
                        ].join('\n');

                        const circle = [
                            "const radius = 300;",
                            "const Xcenter = width/2;",
                            "const Ycenter = height/2;",
                            "ctx.font = 'bold 120px sans-serif';",
                            `ctx.fillStyle = '${colors[Math.floor(Math.random()*colors.length)]}';`,
                            "ctx.arc(Xcenter, Ycenter, radius, 0, 2*Math.PI, false);",
                            "ctx.fill();"
                        ].join('\t\n');


                        const vertShader = [
                            '',
                            'attribute vec2 coordinates;',
                            'void main(void) {',
                            '   gl_Position = vec4(coordinates, 0.0, 1.0);',
                            '}',
                            // '',
                            // 'attribute vec3 coordinates;',
                            // 'attribute vec3 color;',
                            // 'varying vec3 vColor;',
                            // 'void main(void) {',
                            // '   gl_Position = vec4(coordinates, 1.0);',
                            // '   vColor = color;',
                            // '}'
                        ].join('\n\t') + '\n';

                        const fragShader = [
                            '',
                            'void main(void) {',
                            '   gl_FragColor = vec4(1.0, 0.0, 0.0, ${alpha || 1.0});',
                            '}',
                            // '',
                            // 'precision mediump float;',
                            // 'varying vec3 vColor;',
                            // 'void main(void) {',
                            // '   gl_FragColor = vec4(vColor, 1.0);',
                            // '}'
                        ].join('\n\t') + '\n';

                        const webgl = [
                            "// example modded from - https://www.tutorialspoint.com/webgl/webgl_sample_application.htm",
                            "",
                            "/* Step 0: reset everything */",
                            "gl.enable(gl.DEPTH_TEST);",
                            "gl.depthFunc(gl.LEQUAL);",
                            "gl.clearColor(0.0, 0.0, 0.0, 0.0);",
                            "gl.clearDepth(1.0);",
                            "gl.viewport(0.0, 0.0, width, height);",
                            "gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);",

                            "",
                            "/* BLENDING ? */",
                            "//https://mrdoob.github.io/webgl-blendfunctions/blendfunc.html",
                            "//https://stackoverflow.com/a/39354174/1627873",
                            "gl.enable(gl.BLEND);",
                            "//gl.blendEquation( gl.FUNC_ADD );",
                            "//gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);",
                            "gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);",

                            "",
                            "/* Step1: Define the geometry and store it in buffer objects */",
                            "",
                            /*
                            -1.0, 5.0, 
                            -1.0, -2, 
                            5.0, -3,
                            */
                            "var vertices = [0.000,  0.990, -0.99, -0.99, 0.99, -0.99,",
                            "                0.995, -0.990, 0.995, 0.995, 0.00, 0.995,",
                            "                -0.995, -0.990, 0.00, 0.995, -0.995, 0.995,",
                            "];",
                            "",
                            "// Create a new buffer object",
                            "var vertex_buffer = gl.createBuffer();",
                            "",
                            "// Bind an empty array buffer to it",
                            "gl.bindBuffer(gl.ARRAY_BUFFER, vertex_buffer);",
                            "",
                            "// Pass the vertices data to the buffer",
                            "gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);",
                            "",
                            "// Unbind the buffer",
                            "gl.bindBuffer(gl.ARRAY_BUFFER, null);",
                            "",
                            "/* Step2: Create and compile Shader programs */",

                            // vertex shader
                            "// Vertex shader source code",
                            "var vertCode = document.getElementById('vertex-shader').text;",
                            "// Create a vertex shader object",
                            "var vertShader = gl.createShader(gl.VERTEX_SHADER);",
                            "",
                            "// Attach vertex shader source code",
                            "gl.shaderSource(vertShader, vertCode);",
                            "",
                            "// Compile the vertex shader",
                            "gl.compileShader(vertShader);",
                            "",
                            // fragment shader
                            "// Fragment shader source code",
                            "var fragCode = document.getElementById('fragment-shader').text;",
                            "",
                            "// Create fragment shader object",
                            "var fragShader = gl.createShader(gl.FRAGMENT_SHADER);",
                            "",
                            "// Attach fragment shader source code",
                            "gl.shaderSource(fragShader, fragCode);",
                            "",
                            "// Compile the fragment shader",
                            "gl.compileShader(fragShader);",
                            "",
                            "// Create a shader program object to store combined shader program",
                            "var shaderProgram = gl.createProgram();",
                            "",
                            "// Attach a vertex shader",
                            "gl.attachShader(shaderProgram, vertShader);",
                            "",
                            "// Attach a fragment shader",
                            "gl.attachShader(shaderProgram, fragShader);",
                            "",
                            "// Link both programs",
                            "gl.linkProgram(shaderProgram);",
                            "",
                            "// Use the combined shader program object",
                            "gl.useProgram(shaderProgram);",
                            "",
                            "/* Step 3: Associate the shader programs to buffer objects */",
                            "",
                            "// Bind vertex buffer object",
                            "gl.bindBuffer(gl.ARRAY_BUFFER, vertex_buffer);",
                            "",
                            "// Get the attribute location",
                            "var coord = gl.getAttribLocation(shaderProgram, 'coordinates');",
                            "",
                            "// point an attribute to the currently bound VBO",
                            "gl.vertexAttribPointer(coord, 2, gl.FLOAT, false, 0, 0);",
                            "",
                            "// Enable the attribute",
                            "gl.enableVertexAttribArray(coord);",
                            "",
                            "/* Step4: Drawing the required object (triangle) */",
                            "",
                            "// Clear the canvas",
                            "gl.clearColor(0.0, 0.0, 0.0, 0.0);",
                            "",
                            "// Enable the depth test",
                            "gl.enable(gl.DEPTH_TEST); ",
                            
                            "// Clear the color buffer bit",
                            "gl.clear(gl.COLOR_BUFFER_BIT);",
                            "",
                            "// Set the view port",
                            "gl.viewport(0,0, width, height);",
                            "",
                            "// Draw the triangle",
                            "gl.drawArrays(gl.TRIANGLES, 0, vertices.length/2);",


                        ].join('\n')

                        const examples = {
                            webgl,
                            triangle,
                            square,
                            octagon,
                            circle,
                            smiley,
                            text
                        }
                        const defaultExample = 'webgl';
                        const defaultType = 
                        layerDef.value = examples[defaultExample];
                        layerName.value = defaultExample;
                        layerType.value = '3D Canvas';

                        Object.keys(examples).forEach(key => {
                            var tabItem = createElementFromHTML(
                                `<div class="tab${key===defaultExample ? ' active' : ''}">${key}</div>`
                            );
                            tabItem.onclick = (e) => {
                                container.querySelector('.tab.active').classList.remove('active');
                                e.target.classList.add('active');
                                layerDef.value = examples[key];
                                layerName.value = key;
                                // TODO: also change text of layerDef and name and type !!
                            }
                            tabBar.appendChild(tabItem);
                        });

                        layerAddCancel.onclick = () => {
                            document.getElementById('sidebar').removeChild(container);
                            cancelFn();
                        };
                        layerAddSubmit.onclick = () => {
                            goFn({
                                // build canvas function here
                                def: parseFunction(`function({ ctx, gl, alpha, width, height}){
                                    ${container.querySelector('#layerDef').value}
                                }`),
                                name: container.querySelector('#layerName').value || 'New Layer',
                                type: container.querySelector('#layerType').value
                            });
                            document.getElementById('sidebar').removeChild(container);
                        };

                        document.getElementById('sidebar').appendChild(container);
                    }

                    //use Math.random to force re-evaluation of drag handlers
                    const getLayer = (layer, layersIndex, layers) => li({
                        disabled: true,
                        key: `${section.name}-${item.name}-${index}-li-${layersIndex}}`,
                        id: `${section.name}-${item.name}-${index}-li-${layersIndex}}`,
                        onClick: () => layerSelectedChanged(layersIndex),
                        className: layersSelected.includes(layersIndex) ? 'selected' : '',
                        draggable: true,
                        onDragStart: ({nativeEvent: e}) => dragStartHandler(layersIndex, e),
                        onDragEnter: ({nativeEvent: e}) => dragEnterHandler(layersIndex, layers, e),
                        onDragLeave: ({nativeEvent: e}) => dragLeaveHandler(layersIndex, e),
                        onDragEnd: ({nativeEvent: e}) => dragEndHandler(layersIndex, layers, e),
                        onTouchStart: ({nativeEvent: e}) => touchStartHandler(layersIndex, e),
                        onTouchMove: ({nativeEvent: e}) => touchMoveHandler(layersIndex, layers, e),
                        onTouchEnd: ({nativeEvent: e}) => touchEndHandler(layersIndex, layers, e),
                        onTouchCancel: ({nativeEvent: e}) => touchCancelHandler(layersIndex, layers, e),
                        onDrop: () => { return false; }
                    }, [
                        eyeToggle({
                            svg, g, path, circle, hidden: layersHidden.includes(layersIndex),
                            key: `${section.name}-${item.name}-${index}-eyeToggle-${layersIndex}`,
                            draggable: false,
                            layerClick: () => {
                                layer.onToggle({
                                    number: layersIndex,
                                    visible: layersHidden.includes(layersIndex)
                                });
                                layerVisibleClick(layersIndex);
                            }
                        }),
                        img({
                            className: "image",
                            tabIndex: 0,
                            draggable: false,
                            src: layer.getThumb ? layer.getThumb({ number: layersIndex }) : '',
                            key: `${section.name}-${item.name}-${index}-thumbnail-${layersIndex}`,
                        }),
                        span({
                            className: "label",
                            draggable: false,
                            key: `${section.name}-${item.name}-${index}-name-${layersIndex}`
                            /*, tabIndex: 0*/
                        }, layer.name)
                    ]);

                    const reorderedLayers = layerOrder.length && layerOrder.length === item.layers.length
                        ? layerOrder.map(number => item.layers.find(x => x.number === number))
                        : item.layers.map((x,i) => Object.assign({}, x, { number: i }));

                    const layersList = reorderedLayers.reduce((allLayerLi, oneLayerLi, layersIndex) => {
                        const layerIndex = isNumeric(oneLayerLi.number)
                            ? oneLayerLi.number
                            : layersIndex;
                        allLayerLi.push(getLayer(oneLayerLi, layerIndex, reorderedLayers));
                        allLayerLi.push(layerDropZone(layerIndex + 1 ));
                        return allLayerLi;
                    }, [ layerDropZone(0) ]);

                    const selectedLayers = reorderedLayers.filter((x, i) => (layersSelected||[]).includes(x.number) );
                    //console.log({selectedLayers});

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
                                key: `${section.name}-${item.name}-${index}-props`,
                                className: 'layerProps'
                            }, [
                                selectComponent({ div, span, select, option, section,
                                    item: {
                                        name: 'layer-blend',
                                        disabled: false,
                                        default: 'Normal',
                                        options: [
                                            'Normal', 'Multiply', 'Screen', 'Overlay',
                                            'Darken', 'Lighten', 'Color-Dodge', 'Color-Burn',
                                            'Hard-Light', 'Soft-Light', 'Difference', 'Exclusion',
                                            'Hue', 'Saturation', 'Color', 'Luminosity'
                                        ],
                                        onChange: ({ key, value}) => {
                                            // store in reducer
                                            layersPropertiesChanged({ blend: { key, value } });

                                            (layersSelected || [0] ).forEach(layerNumber => {
                                                const sel = item.layers
                                                    .find(x => x.number === layerNumber);
                                                if(!sel || !sel.changeLayerBlendMode){
                                                    return;
                                                }
                                                sel.changeLayerBlendMode({
                                                    number: layerNumber,
                                                    mode: value.toLowerCase()
                                                });
                                            });
                                        }
                                    },
                                    index, showLabel:false, globalState
                                }),
                                sliderComponent({
                                    span, div, input, section,
                                    item: {
                                        name: 'layer-alpha-slider',
                                        min: 0, max: 100, step: 5, default: 100,
                                        onChange: ({key, value}) => {
                                            // store in reducer
                                            layersPropertiesChanged({ alpha: { key, value } });
                                            // call function for alpha change setup in sidebar def
                                            const changeSelectedAlpha = () => {
                                                (layersSelected || [0] ).forEach(layerNumber => {
                                                    item.layers
                                                        .find(x => x.number === layerNumber)
                                                        .changeLayerAlpha({
                                                            number: layerNumber,
                                                            alpha: Number(value)/100
                                                        })
                                                });
                                            };
                                            changeSelectedAlpha();
                                        }
                                    },
                                    index, showLabel:false, globalState
                                })
                            ]),
                            ul({
                                key: `${section.name}-${item.name}-${index}-ul`
                            }, layersList),
                            div({
                                key: `${section.name}-${item.name}-${index}-tools`,
                                className: 'layerTools'
                            },[
                                editIcon({
                                    key: `${section.name}-${item.name}-${index}-edit-icon`,
                                    svg, g, rect, polygon,
                                    editClick: () => { console.log('---TODO: edit icon click!') }
                                }),
                                buttonComponent({ div, button, section, item: {
                                        name: '+',
                                        onClick: () => constructLayer(
                                            ({ name, def, type }) => {
                                                item.addLayer({
                                                    name,
                                                    def,
                                                    type,
                                                    callback: (layer) => addLayerItem({
                                                        layers: item.layers,
                                                        newLayer: Object.assign({}, layer, {type}),
                                                        layerOrder: layerOrder.length ? layerOrder : null
                                                    })
                                                });
                                            },
                                            () => {
                                                console.log('TODO: cancel layer add');
                                            }
                                        )
                                    }
                                }),
                                buttonComponent({ div, button, section, item: {
                                    name: '-',
                                    onClick: () => removeLayers(item)
                                }
                            })
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

                const root = ({
                    globalState = [],
                    pinned = sidebarDef.pinned,
                    hidden = sidebarDef.hidden,
                    layersHidden,
                    layersSelected = [ 0 ],
                    layersProperties = [{
                        number: 0,
                        alpha: 100,
                        blend: 'Normal'
                    }],
                    layerOrder = []
                }) =>
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
                                        slider: () => sliderComponent({ div, span, input, section, item, index: j, globalState }),
                                        boolean: () => booleanComponent({ div, span, label, input, section, item, index: j }),
                                        button: () => buttonComponent({ div, button, section, item, index: j }),
                                        select: () => selectComponent({ div, span, select, option, section, item, index: j, globalState}),
                                        layers: () => layersComponent({ div, span, section, item, img, index: j,
                                            layersHidden, layersSelected, globalState, layerOrder
                                        })
                                    })[item.type];
                                })
                                .forEach(component => all.push(component()));
                            return all;
                        }, [])
                    )
                ]);

                return root;
            }

            const getInitialState = () => ({
                layersHidden: sidebarDef.sections[0].items
                    .find(x => x.type === 'layers').layersHidden,
                globalState: [],
                layersProperties: [],
                layersSelected: [0],
                layerOrder: undefined, //TODO:
                pinned: undefined, //TODO:
                hidden: undefined, //TODO:
            });

            // reducer should be built with respect to sidebar definition
            const getReducer = () => {
                const reducer = (state, action) => {    
                    var newState = clone(state);

                    function updateSelectedLayers(state, layersSelected){
                        const found = (state.layersProperties || []).find(x => layersSelected.includes(x.number));
                        var newGlobalState = clone(state.globalState || []) || [];
                        
                        // NOTE: "predicate" - another word I wanted to use instead of "condition"
                        const upsert = ({ item, array, condition }) => {
                            const found = array.find(condition);
                            if( found ){
                                Object.keys(item)
                                    .forEach(key => found[key] = item[key]);
                            } else {
                                array.push(item);
                            }
                        }

                        if( found && found.alpha && found.alpha.key){
                            upsert({
                                item: found.alpha,
                                array: newGlobalState,
                                condition: x => x.key === found.alpha.key
                            }); 
                        }
                        if( found && found.blend && found.blend.key){
                            upsert({
                                item: found.blend,
                                array: newGlobalState,
                                condition: x => x.key === found.blend.key
                            }); 
                        }
                        if(!found){
                            newGlobalState = newGlobalState
                                .filter(x => !x.key.includes('layer-alpha')
                                    && !x.key.includes('layer-blend')
                                );
                        }
                        newState = Object.assign({}, state, { layersSelected, globalState: newGlobalState });
                        return newState;
                    }

                    switch(action.type){
                        case 'REMOVE_LAYERS': {
                            const selectedLayers = newState.layersSelected || [action.payload.layers[0].number];
                            //console.log(`removing ${selectedLayers}`)
                            const callback = () => {
                                const newLayers = action.payload.layers
                                    .filter((x, i) => !selectedLayers.includes(x.number));
                                action.payload.layers = newLayers;
                            };
                            if(action.payload.removeLayers){
                                action.payload.removeLayers({
                                    numbers: selectedLayers,
                                    callback
                                });
                            }
                            var layerOrder = newState.layerOrder
                                || action.payload.layers.map(layer => layer.number);
                            layerOrder = layerOrder.filter(number => !selectedLayers.includes(number));
                            newState = Object.assign({}, state, {
                                layerOrder,
                                layersSelected: [layerOrder[0]]
                            });
                            break;
                        }
                        case 'ADD_LAYER_ITEM': {
                            //TODO: there should be a state.layers =(
                            //console.log(state.layers);

                            //action.payload.layers = [action.payload.newLayer].concat(action.payload.layers);

                            var layerOrder = action.payload.layerOrder
                                || action.payload.layers.map(layer => layer.number);
                            layerOrder = [action.payload.newLayer.number].concat(layerOrder);
                            newState = Object.assign({}, state, { layerOrder });
                            action.payload.layers.push(action.payload.newLayer);
                            
                            newState = updateSelectedLayers(newState, [action.payload.newLayer.number]);
                            break;
                        }
                        case 'REORDER_LAYERS': {
                            const layerOrder = action.payload.order;
                            newState = Object.assign({}, state, { layerOrder });
                            break;
                        }
                        case 'SET_GLOBAL_STATE': {
                            const gstate = state.globalState || [];
                            const found = gstate.find(x => x.key === action.payload.key);
                            if(found){
                                found.value = action.payload.value;
                            } else {
                                gstate.push(action.payload);
                            }
                            newState = Object.assign({}, state, { globalState: gstate });
                            break;
                        }
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
                        case 'LAYER_VISIBILE_TOGGLED': {
                            var layersHidden = state.layersHidden || [];
                            if (!isNumeric(action.payload)){
                                console.log('Error in reducer: LAYER_VISIBILE_TOGGLED');
                                break;
                            }
                            const layerNumber = Number(action.payload);
                            if(layersHidden.includes(layerNumber)){
                                layersHidden = layersHidden.filter(x => x !== layerNumber);
                            } else {
                                layersHidden.push(layerNumber);
                            }
                            newState = Object.assign({}, state, { layersHidden });
                            break;
                        }
                        case 'LAYER_SELECTION_CHANGED': {
                            //TODO: case where all layers are deselected
                            //TODO: case where multiple layers are selected
                            const layersSelected = [ action.payload ];
                            newState = updateSelectedLayers(state, layersSelected);
                            break;
                        }
                        case 'LAYERS_PROPERTIES_CHANGE': {
                            var newLayersProperties = state.layersProperties
                                ? clone(state.layersProperties)
                                : [];
                            const currentSelectedLayers = state.layersSelected || [ 0 ];
                            console.log(`current selected layers ${currentSelectedLayers}`);
                            currentSelectedLayers.forEach(selected => {
                                // ensure existence
                                const exists = (newLayersProperties || []).map(prop => prop.number).includes(selected);
                                if(!exists && newLayersProperties){
                                    // default
                                    newLayersProperties.push({
                                        number: selected,
                                        alpha: 100,
                                        blend: 'Normal'
                                    });
                                }
                                // set
                                (newLayersProperties || [])
                                    .filter(x => x.number === selected)
                                    .forEach(x => {
                                        if(action.payload.blend){
                                            //console.log(`change ${selected} blend from ${x.blend.value} to ${action.payload.blend.value}`);
                                            x.blend = action.payload.blend;
                                        }
                                        if(action.payload.alpha){
                                            x.alpha = action.payload.alpha;
                                        }
                                    });
                            });
                            newState = Object.assign({}, state, { layersProperties: newLayersProperties });
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

                const sidebarRoot = document.createElement("div");
                sidebarRoot.id = 'sidebar';
                document.body.appendChild(sidebarRoot);
                start({
                    reducer: getReducer(),
                    root: getRoot(components, dispatcher),
                    attach: sidebarRoot,
                    initialState: getInitialState()
                }, startCallback);
            }

            return rxReact.init(rxReactReady);
        }

        return callback(null, { start: sidebarStart });
    };
    sidebar.init = callback => {
        // TODO: might be done like sidebar.script (eg. sidebar.css = ['sidebar.css'])
        appendCss('sidebar');

        return isInitedFactory(sidebar, callback);
    }


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
