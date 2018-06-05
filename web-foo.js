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
                }

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

                function selectComponent({ div, span, select, option, section, item, index, showLabel=true }){
                    return (
                        div({
                            key: `${section.name}-${item.name}-${index}`,
                            className: 'select-component'
                        }, [
                            showLabel
                                ? span({ key: `${section.name}-${item.name}-${index}-span`, className: 'label' }, item.name)
                                : undefined,
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

                        layerDef.value = ''
                            + "var centerX = width / 2;\n"
                            + "var centerY = height / 2;\n"
                            + "var radius = 70;\n"
                            + "var eyeRadius = 10;\n"
                            + "var eyeXOffset = 25;\n"
                            + "var eyeYOffset = 20;\n"

                            + "\n// face\n"
                            + "ctx.beginPath();\n"
                            + "ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI, false);\n"
                            + "ctx.fillStyle = 'yellow';\n"
                            + "ctx.fill();\n"
                            + "ctx.lineWidth = 3;\n"
                            + "ctx.strokeStyle = 'black';\n"
                            + "ctx.stroke();\n"

                            + "\n// eyes\n"
                            + "ctx.beginPath();\n"
                            + "var eyeX = centerX - eyeXOffset;\n"
                            + "var eyeY = centerY - eyeXOffset;\n"
                            + "ctx.arc(eyeX, eyeY, eyeRadius, 0, 2 * Math.PI, false);\n"
                            + "var eyeX = centerX + eyeXOffset;\n"
                            + "ctx.arc(eyeX, eyeY, eyeRadius, 0, 2 * Math.PI, false);\n"
                            + "ctx.fillStyle = 'black';\n"
                            + "ctx.fill();\n"

                            + "\n// mouth\n"
                            + "ctx.beginPath();\n"
                            + "ctx.arc(centerX, centerY+7, 25, Math.PI, 2*Math.PI, false);\n"
                            + "ctx.stroke();\n"
                        + '';

                        layerAddCancel.onclick = () => {
                            document.getElementById('sidebar').removeChild(container);
                        };
                        layerAddSubmit.onclick = () => {
                            goFn({
                                def: parseFunction(`function({ ctx, width, height}){
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
                                        name: 'layer-blend-select',
                                        options: ['Normal', 'Darken', 'Lighten', 'Burn'],
                                        onChange: (value) => console.log(`TODO: change layer blend to: ${value}`)
                                    },
                                    index, showLabel:false
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
                                                        newLayer: layer,
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
                    layersHidden = [],
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
                                        slider: () => sliderComponent({ span, div, input, section, item, index: j, globalState }),
                                        boolean: () => booleanComponent({ div, span, label, input, section, item, index: j }),
                                        button: () => buttonComponent({ div, button, section, item, index: j }),
                                        select: () => selectComponent({ div, span, select, option, section, item, index: j}),
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
            
            //TODO: default state ???

            // reducer should be built with respect to sidebar definition
            const getReducer = () => {
                const reducer = (state, action) => {
                    var newState = clone(state);
                    switch(action.type){
                        case 'REMOVE_LAYERS': {
                            const selectedLayers = newState.layersSelected || [action.payload.layers[0].number];
                            console.log(`removing ${selectedLayers}`)
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
                            const found = (state.layersProperties || []).find(x => x.number === action.payload);
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
                            break;
                        }
                        case 'LAYERS_PROPERTIES_CHANGE': {
                            var newLayersProperties = state.layersProperties
                                ? clone(state.layersProperties)
                                : [];
                            const currentSelectedLayers = state.layersSelected || [ 0 ];
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
                    attach: sidebarRoot
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
