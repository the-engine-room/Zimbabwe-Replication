'use strict';
(function (U, $) {

    if (!Array.from){
        Array.from = function (object) {
            return [].slice.call(object);
        };
    }


    /*
    ** Main IPPR object holding all the info about the dom and data
    */
    var IPPR = {
        dom: {
            header: $('.Header'),
            data: $('.Data'),
            lists: {
                main: '.List--main',
                extra: '.List--extra',
                info: '.List--info',
                count: '.List-count',
                header: '.List-header',
                holder: '.List-holder',
                title: '.List-title',
                list: '.collection',
                infoName: '.List-infoName',
                headerActive: '.List-headerActive',
                headerInActive: '.List-headerInactive',
                switch: '.List-switch'
            },
            content: $('.Content'),
            tabs: $('.Header-tabs a'),
            levels: $('div[data-level]'),
            dataHolder: $('.Data-holder'),
            filters: {
                main: '.Filters',
                mobile: '.Filters--mobile',
                item: '.Filters .chip',
                trigger: $('.Filters-trigger'),
                activeHolder: $('.Filters-active'),
                remove: $('Filters-remove'),
                search: $('.Search-field'),
                searchRemove: $('.Search-remove'),
                searchTrigger: $('.Search-trigger'),
            },
            map: $('.Map'),
            mapTrigger: $('.Map-trigger'),
            mapInline: $('.Map--inline'),
            showInfo: '.js-showAdditionalInfo',
            sankey: {
                mobile: '.Sankey-mobile',
                desktop: '.Sankey-desktop',
            },
            additionalInfo: $('.AdditionalInfo'),
            additionalInfoTitle: $('.AdditionalInfo-title'),
            additionalInfoHeader: $('.AdditionalInfo-header'),
            footer: $('.Footer'),
            templates: {
                main: '.main-tpl', // This should get fed company names
                extra: '.extra-tpl', // this should get mines for the company
                licenceTable: '.licenceTable-tpl',
                companyTable: '.companyTable-tpl',
                ownedLicenses: '.ownedLicenses-tpl',
                hierarchy: '.hierarchy-tpl',
                revenue: '.revenue-tpl'
            },
            additionalInfoStrings: {
                licence: 'Info for Licence number <span></span>',
                company: 'Additional information'
            },
            ownedLicenses: '.OwnedLicenses',
            hierarchy: '.Hierarchy',
            table: '.Table',
            revenue: '.Revenue'
        },
        states: {
            loading: 'is-loading',
            active: 'is-active',
            animate: 'has-animation',
            hidden: 'u-isHidden',
            visible: 'is-visible',
            selected: 'is-selected',
            mobile: false,
            desktop: false,
            view: 'companies',
            hightlight: 'companies',
            map: false,
            filters: false
        },
        data: {
            apiURL: 'https://miningpachena.carto.com/api/v2/sql/?q=',
            data: {},
            tabs: {
                0: {
                    name: 'companies',
                    sql: "SELECT m.cartodb_id AS mine_id, m.name AS mine_name, m.district AS mine_district, m.region as mine_region, m.status as mine_status, c.cartodb_id AS company_id, c.name AS company_name, c.address AS company_address, c.hq AS company_hq, c.jurisdiction AS company_jurisdiction, c.registration AS company_registration, c.website AS company_website FROM zw_companies c, zw_company_mines cm, zw_mines m WHERE c.cartodb_id = cm.company_id AND cm.mine_id = m.cartodb_id",
                    groupBy: 'company_id'
                },
                1: {
                    name: 'mines',
                    sql: "SELECT m.cartodb_id AS mine_id, m.name AS mine_name, m.district AS mine_district, m.region as mine_region, m.status as mine_status, c.cartodb_id AS company_id, c.name AS company_name, c.address AS company_address, c.hq AS company_hq, c.jurisdiction AS company_jurisdiction, c.registration AS company_registration, c.website AS company_website FROM zw_companies c, zw_company_mines cm, zw_mines m WHERE c.cartodb_id = cm.company_id AND cm.mine_id = m.cartodb_id",
                    groupBy: 'mine_id'
                },
                2: {
                    name: 'minerals',
                    sql: "SELECT mns.cartodb_id as mine_id, mns.district AS mine_district, mns.name AS mine_name, mns.region AS mine_region, mns.status AS mine_status, mls.name AS mineral FROM zw_mines mns, zw_mine_minerals mm, zw_minerals mls WHERE mns.cartodb_id = mm.mine_id AND mm.mineral_id = mls.cartodb_id",
                    groupBy: 'mineral'
                }
            },
        },
        map: {
            map: [],
            layers: [],
            markers: [],
            styles: {
                default: {
                    radius: 8,
                    weight: 1,
                    fill: true,
                    fillColor: '#5E8FB1',
                    dashArray: '',
                    color: '#000',
                    fillOpacity: 1
                },
                active: {
                    radius: 8,
                    weight: 2,
                    fill: true,
                    fillColor: '#256A9A',
                    dashArray: '',
                    color: '#000',
                    fillOpacity: 1
                },
                filtered: {
                    radius: 8,
                    weight: 3,
                    fill: true,
                    fillColor: '#93B4CB',
                    dashArray: '',
                    color: 'transparent',
                    fillOpacity: 1
                }
            },
            highlightLayer: function(key,id){
                
                // collect mine ids for mineral highliting 
                if(IPPR.states.highlight === 'minerals'){
                    var minesIds = [];
                    $.each( $('p.List-switch'), function(index, element){
                        minesIds.push( $(element).data('id'));
                    });    
                }
                
                $.each(IPPR.map.layers[key], function(k,value){

                    IPPR.map.layers[key][k].closePopup();
                    if (!IPPR.states.filters){
                        IPPR.map.layers[key][k].setStyle(IPPR.map.styles.default);
                        $(IPPR.map.markers[key][k]._icon).removeClass(IPPR.states.active);
                        $(IPPR.map.markers[key][k]._icon).removeClass(IPPR.states.selected);
                        IPPR.map.layers[key][k].isActive = false;
                        IPPR.map.markers[key][k].isActive = false;
                    }

                    if (IPPR.states.highlight === 'mines' && value.ID === id  || IPPR.states.highlight === 'minerals' && (minesIds.indexOf(value.ID) >= 0)  || IPPR.states.highlight === 'companies' && value.company_id === id){
                            
                        /*    
                        if(IPPR.states.highlight === 'minerals'){
                            console.log('-- INIT DEBUG ---');
                            console.log('value.ID: ' + value.ID);
                            console.log('value.cartodb_id: ' + value.cartodb_id);
                            console.log(minesIds);
                            console.log(minesIds.indexOf(value.cartodb_id));
                            console.log('--- EOF DEBUG ---');
                        }
                        */
                        
                        IPPR.map.layers[key][k].setStyle(IPPR.map.styles.active);
                        IPPR.map.layers[key][k].openPopup();
                        
                        IPPR.map.layers[key][k].bringToFront();
                        IPPR.map.layers[key][k].isActive = true;
                        IPPR.map.markers[key][k].isActive = true;
                        $(IPPR.map.markers[key][k]._icon).addClass(IPPR.states.selected);
                            
                        if(IPPR.states.mobile){
                            setTimeout(function(){
                                if (IPPR.map.markers[key][k]._latlng.lat && IPPR.map.markers[key][k]._latlng.lng){
                                    IPPR.map.map[key].setView(new L.LatLng(IPPR.map.markers[key][k]._latlng.lat, IPPR.map.markers[key][k]._latlng.lng), 6);
                                }
                            },200);
                        }
                        
                    }

                });
            },
            resetLayers: function(){
                $.each(IPPR.map.layers, function(k,v){
                    $.each(v, function(index) {
                       IPPR.map.layers[k][index].setStyle(IPPR.map.styles.default);
                       $(IPPR.map.markers[k][index]._icon).removeClass(IPPR.states.active);
                       $(IPPR.map.markers[k][index]._icon).removeClass(IPPR.states.selected);
                    });
                });
            },
            searchLayers: function(type){

                if (!IPPR.states.filters){
                    IPPR.map.resetLayers();
                }

                var key = type === 'companies' ? 0 : 2,
                    listItems = $(IPPR.dom.lists.main+':visible').find('.collection-item'),
                    ids = [];

                $.each(listItems, function(index, val) {
                    ids.push($(val).data('id'));
                });

                $.each(IPPR.map.layers[key], function(k,v){
                    if(IPPR.states.view === 'mines' && $.inArray(v.ID, ids) < 0 || IPPR.states.view === 'minerals' && $.inArray(v.ID, ids) < 0 ||  IPPR.states.view === 'companies' && $.inArray(v.company_id, ids) < 0){

                        IPPR.map.layers[key][k].setStyle(IPPR.map.styles.filtered);

                        $(IPPR.map.markers[key][k]._icon).removeClass(IPPR.states.active);
                        $(IPPR.map.markers[key][k]._icon).removeClass(IPPR.states.selected);
                        IPPR.map.layers[key][k].isActive = false;
                        IPPR.map.markers[key][k].isActive = false;
                    } else {
                        $(IPPR.map.markers[key][k]._icon).removeClass(IPPR.states.selected);
                        IPPR.map.layers[key][k].setStyle(IPPR.map.styles.default);
                        IPPR.map.layers[key][k].isActive = true;
                        IPPR.map.markers[key][k].isActive = true;
                    }
                });

                setTimeout(function(){
                    var size = $(IPPR.dom.lists.main+':visible').find('.collection-item').size();
                    $(IPPR.dom.lists.main).find(IPPR.dom.lists.count).html('('+size+')');
                },50);

            }
        },
        filters: {
            list: [],
            options: {
                valueNames: ['List-title', 'concessionNumbers', 'expiration'],
                listClass: 'collection',
                searchClass: 'Search-input'
            },
            clear: function(){
                $.each(IPPR.filters.list, function(k){
                    IPPR.filters.list[k].filter();
                });
                $(IPPR.dom.filters.item).removeClass(IPPR.states.active);
                IPPR.dom.filters.search.removeClass(IPPR.states.hidden);
                IPPR.dom.filters.activeHolder.empty();
            }
        },
        helpers: {
            groupBy: function(xs, key) {
                return xs.reduce(function(rv, x) {
                    (rv[x[key]] = rv[x[key]] || []).push(x);
                    return rv;
                }, {});
            },
            unique(value, index, self) {
                return self.indexOf(value) === index;
            }
        }
    };





    /*
    ** Set / remove loading classes while the data loads
    */
    IPPR.loading = function(){
        IPPR.dom.data.toggleClass(IPPR.states.loading);
    };


    /*
    ** Get the data for each tab and store it in the main IPPR object.
    */
    IPPR.getData = function(){

        var markup = [],
            mustacheTpl = [],
            title,id,expiration = false;

        /*
        ** For each tab ...
        */
        $.each(IPPR.data.tabs, function(key, tab){

            markup[key] = '';
            mustacheTpl[key] = $('#tab-'+key).find(IPPR.dom.templates.main).html();

            /*
            ** ... get the data from carto.com
            */
            $.getJSON(IPPR.data.apiURL + tab.sql, function(data) {
                /*
                ** ... sort data - broup by, store it the main IPPR object
                */
                IPPR.data.data[key] = IPPR.helpers.groupBy(data.rows, tab.groupBy);

                /*
                ** .. run through the data, parse the templates
                */
                $.each(IPPR.data.data[key], function(k, value){

                    /*
                    ** ... parse the template for future use
                    */
                    Mustache.parse(mustacheTpl[key]);

                    /*
                    ** ... assign data to templates
                    */
                    if (tab.name === 'companies'){
                        title = value[0].company_name;
                        id = value[0].company_id;
                    } else if (tab.name === 'minerals') {
                        title = k;
                        id = k;
                    } else {
                        title = value[0].mine_name;
                        id = value[0].mine_id;
                    }

                    /*
                    ** ... render templates with the data
                    */
                    markup[key] += Mustache.render(
                        mustacheTpl[key], {
                            title: title,
                            id: id,
                            expiration: expiration
                        }
                    );
                });



                /*
                ** ... append the data to the main lists in each tab
                */
                $('#tab-'+key).find(IPPR.dom.lists.main).find(IPPR.dom.lists.list).html(markup[key]);
                $('#tab-'+key).find(IPPR.dom.lists.main).find(IPPR.dom.lists.count).html('(' + Object.keys(IPPR.data.data[key]).length + ')');

                /*
                ** ... we are done with the data, set loading to false and turn on the filtering
                */
                if (Object.keys(IPPR.data.tabs).length - 1 === parseInt(key)){
                    IPPR.loading();
                    setTimeout(function(){
                        IPPR.filtering();
                    },300);
                }

            });

        });
    };

    /*
    ** Initialize the maps ...
    */
    IPPR.initMap = function(){

        /*
        ** ... get the geo json data
        */
        $.getJSON('https://miningpachena.carto.com/api/v2/sql/?format=GeoJSON&q=SELECT * FROM zw_mines', function(data){

            /*
            ** ... for each map in the dom initialize the maps and populate with layers and markers
            */
            $.each(IPPR.dom.map, function(key,val){

                var that = $(val);


                IPPR.map.layers[key] = [];
                IPPR.map.markers[key] = [];

                /***  little hack starts here ***/
                L.Map = L.Map.extend({
                    openPopup: function(popup) {
                        //        this.closePopup();  // just comment this
                        this._popup = popup;

                        return this.addLayer(popup).fire('popupopen', {
                            popup: this._popup
                        });
                    }
                }); /***  end of hack ***/

                /*
                ** ... init map
                */
                IPPR.map.map[key] = L.map($('.Map').eq(key)[0],{
                    scrollWheelZoom: false,
                    zoomControl: false
                }).setView([-18.997, 23.908], 7); // map centering

                /*
                ** ... change zoom controls to be in the bottom right corner
                */
                L.control.zoom({
                     position:'bottomright'
                }).addTo(IPPR.map.map[key]);

                /*
                ** ... base layer with the map of the world
                */
                L.tileLayer('https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png', {
                    maxZoom: 18
                }).addTo(IPPR.map.map[key]);

                /*
                ** ... function to be executed on each layer
                */
                function onEachLayer(feature, layer) {

                    /*
                    ** ... append the data to each layer
                    */
                    $.each(feature.properties, function(index, val) {
                        layer[index] = val;
                    });

                    /*
                    ** ... extra data
                    */
                    layer.ID = feature.properties.cartodb_id;
                    layer.company_id = feature.properties.company_id;

                    if (feature.properties && feature.properties.popupContent) {
                        layer.bindPopup(feature.properties.popupContent);
                    } else {
                        layer.bindPopup('<ul class="Map-popup"><li><strong>Name:</strong> '+ feature.properties.name +'</li><li><strong>Region:</strong> '+ feature.properties.region +'</li><li><strong>District:</strong> '+ feature.properties.district +'</li><li><strong>Status:</strong> '+ feature.properties.status +'</li></ul>');
                    }

                    /*
                    ** ... push the layers for later use
                    */
                    IPPR.map.layers[key].push(layer);

                    /*
                    ** ... add labels to the polygons
                    */
                    var marker = L.marker(layer._latlng, {
                      icon: L.divIcon({
                            className: 'Map-label'
                        })
                    }).addTo(IPPR.map.map[key]);
                    /*
                    ** ... push the labels for later use
                    */

                    IPPR.map.markers[key].push(marker);

                    /*
                    ** ... each layer AND marker/label has a click function
                    */
                    function onClick(){

                        /*
                        ** ... if the current view is filtered (has active search or filtering) restyle the layers
                        */
                        if (IPPR.states.filters){
                            IPPR.map.searchLayers(IPPR.states.view);
                        }

                        /*
                        ** ... If this label or marker is not active remove all active filters and reset search
                        */
                        if (!this.isActive){ // jshint ignore:line
                            IPPR.dom.filters.searchRemove.click();
                        }


                        /*
                        ** ... click the item in the main list, scroll list to the top
                        */
                        var elem, top;
                        if (that.is('.mines')){
                            elem = $(IPPR.dom.lists.main).find('li[data-id="'+ feature.properties.license_id +'"]');
                            elem.click();
                            top = elem.position().top;
                            $(IPPR.dom.lists.main).find(IPPR.dom.lists.holder).scrollTop(top);
                        } else if (that.is('.companies')){
                            elem = $(IPPR.dom.lists.main).find('li[data-id="'+ feature.properties.company_id +'"]');
                            elem.click();
                            top = elem.position().top;
                            $(IPPR.dom.lists.main).find(IPPR.dom.lists.holder).scrollTop(top);
                        }


                    }

                    /*
                    ** ... assign the click events on layers and markers/labels
                    */
                    marker.on('click',onClick);
                    layer.on('click',onClick);
                }

                /*
                ** ... parse the geojson data and add it to the map
                */
                L.geoJson([data], {
                    pointToLayer: function (feature, latlng) {
                        return L.circleMarker(latlng, IPPR.map.styles.default);
                    },
                    onEachFeature: onEachLayer
                })
                .addTo(IPPR.map.map[key]);

            });

        });

    };


    /*
    ** Switch from licence to company and vice versa with that licence or company selected
    */
    $(document).on('click', IPPR.dom.lists.switch, function(){
        var id = $(this).data('id'),
            view = $(this).data('to');

        IPPR.states.view = view;

        $('a[data-view="'+view+'"]').click();

        setTimeout(function(){
            $('.collection-item[data-id="'+id+'"]').click();
            var top = $('.collection-item[data-id="'+id+'"]').position().top;
            $(IPPR.dom.lists.main).find(IPPR.dom.lists.holder).scrollTop(top);
        },100);

    });

    /*
    ** Display additional data for each clicked licence and compay below the main elements (lists with map) ...
    */
    IPPR.displayAdditionalInfo = function(item,type){

        var tableData,title,mustacheTpl,finalTable,hierarchyTpl,finalHierarchy,revenueTpl,finalRevenue;

        /*
        ** ... if this is licence
        */
        if (type === 'mine'){


            /*
            ** ... append the title, change the background color
            */
            $(IPPR.dom.additionalInfoTitle).html(IPPR.dom.additionalInfoStrings[type]);
            $(IPPR.dom.additionalInfoHeader).removeClass('green').addClass('blue');

            /*
            ** ... get the data from data attributes
            */
            title = item.find(IPPR.dom.lists.title).html();

            /*
            ** ... get and parse the template for the table
            */
            mustacheTpl = $(IPPR.dom.templates.licenceTable).html();
            Mustache.parse(mustacheTpl);
/*
           $.getJSON(IPPR.data.apiURL + "SELECT * FROM na_detailed_license_transfers WHERE license_id = " + item.data('id') + ' ORDER BY transfer_date&api_key=6fce048c2d9eb832fb12e78b4252d18c7f0b2411', function(data) {

                var sankeyData = [];
                // [[ "Goverment of Namibia 100%", "Eco oil and gas 20%", 10, "20%"],[ "Eco oil and gas 20%", "Eco oil and gas 10%", 5, "10%" ],[ "Eco oil and gas 20%", "New Buyer 10%", 5, "10%" ],[ "Goverment of Namibia 100%", "Goverment of Namibia 80%", 8, "80%"]]


                finalTable = Mustache.render(
                    mustacheTpl, {
                        tableRows: Array.from(data.rows),
                    }
                );

                $.each(data.rows, function(index, val) {
                    sankeyData.push([val.seller,val.buyer, Math.ceil(val.buyer_stake_after || 100), val.seller_stake_prior + '% ->' + val.buyer_stake_after + '%']);
                });

                if (IPPR.states.mobile){

                    /*
                    ** ... draw sankey graph
                    */   /*
                    IPPR.sankey(sankeyData, IPPR.dom.sankey.mobile);
                    $(IPPR.dom.lists.info).find(IPPR.dom.table).html(finalTable);
                    IPPR.dom.additionalInfo.addClass(IPPR.states.hidden);
                } else {
                    $(IPPR.dom.sankey.desktop).removeClass(IPPR.states.hidden);
                    IPPR.sankey(sankeyData, IPPR.dom.sankey.desktop);
                    IPPR.dom.additionalInfo.find(IPPR.dom.table).html(finalTable);
                }

            });
*/
            /*
            ** ... hide the company addition info because we are on licences
            */
            IPPR.dom.additionalInfo.find(IPPR.dom.ownedLicenses).addClass(IPPR.states.hidden);
            IPPR.dom.additionalInfo.find(IPPR.dom.hierarchy).addClass(IPPR.states.hidden);


            /*
            ** ... append data to the DOM
            */
            if (IPPR.states.mobile){
                $(IPPR.dom.lists.info).find(IPPR.dom.lists.infoName).html(title);
                IPPR.dom.additionalInfo.addClass(IPPR.states.hidden);
            } else {
                IPPR.dom.additionalInfo.removeClass(IPPR.states.hidden);
                IPPR.dom.additionalInfo.find('.AdditionalInfo-title span').html(title);
            }
        } else if (type === 'company'){
            /*
            ** ... if this is company, get the data and append to the DOM
            */

            $(IPPR.dom.additionalInfoTitle).html(IPPR.dom.additionalInfoStrings[type]);
            $(IPPR.dom.additionalInfoHeader).removeClass('blue').addClass('green');

            IPPR.dom.additionalInfo.removeClass(IPPR.states.hidden);

            tableData = IPPR.data.data[0][item.data('id')][0];
            // ownedLicenses = item.data('ownedlicenses');

            mustacheTpl = $(IPPR.dom.templates.companyTable).html();
            // ownedLicensesTpl = $('.ownedLicenses-tpl').html();
            hierarchyTpl = $(IPPR.dom.templates.hierarchy).html();
            revenueTpl = $(IPPR.dom.templates.revenue).html();

            Mustache.parse(mustacheTpl);
            // Mustache.parse(ownedLicensesTpl);
            Mustache.parse(hierarchyTpl);

            finalTable = Mustache.render(
                mustacheTpl, {
                    tableRows: tableData,
                }
            );

            // finalownedLicenses = Mustache.render(
            //     ownedLicensesTpl, {
            //         licence: Array.from(ownedLicenses),
            //     }
            // );

            /*
            ** ... get the company info and append to the DOM
            ** SELECT * FROM na_people WHERE company_id = 6 ORDER BY name ASC
            */

            $.getJSON('https://miningpachena.carto.com/api/v2/sql/?q=SELECT * FROM zw_people P JOIN zw_company_people C ON P.cartodb_id = C.people_id WHERE company_id = ' + item.data('id'), function(data) {

                finalHierarchy = Mustache.render(
                    hierarchyTpl, {
                        hierarchy: data.rows,
                    }
                );

                if (data.rows.length){
                    if (IPPR.states.mobile){
                        $(IPPR.dom.lists.extra).find(IPPR.dom.hierarchy).html(finalHierarchy).removeClass(IPPR.states.hidden);
                    } else {
                        IPPR.dom.additionalInfo.find(IPPR.dom.hierarchy).html(finalHierarchy).removeClass(IPPR.states.hidden);
                    }
                } else {
                    if (IPPR.states.mobile){
                        $(IPPR.dom.lists.extra).find(IPPR.dom.hierarchy).addClass(IPPR.states.hidden);
                    } else {
                        IPPR.dom.additionalInfo.find(IPPR.dom.hierarchy).addClass(IPPR.states.hidden);
                    }
                }

            });


           $.getJSON("https://miningpachena.carto.com/api/v2/sql/?q=SELECT company_id FROM zw_companies C JOIN zw_company_expenditures E ON C.cartodb_id = CAST(E.company_id AS Integer) JOIN zw_expenditures D ON CAST(E.revenue_id AS Integer) = D.cartodb_id WHERE company_id='" + item.data('id') + "'", function(data) {

                finalRevenue = Mustache.render(
                    revenueTpl, {
                        tableRows: data.rows
                    }
                );

                if (data.rows.length){
                    if (IPPR.states.mobile){
                        $(IPPR.dom.lists.extra).find(IPPR.dom.revenue).html(finalRevenue).removeClass(IPPR.states.hidden);
                    } else {
                        IPPR.dom.additionalInfo.find(IPPR.dom.revenue).html(finalRevenue).removeClass(IPPR.states.hidden);
                    }
                } else {
                    if (IPPR.states.mobile){
                        $(IPPR.dom.lists.extra).find(IPPR.dom.revenue).addClass(IPPR.states.hidden);
                    } else {
                        IPPR.dom.additionalInfo.find(IPPR.dom.revenue).addClass(IPPR.states.hidden);
                    }
                }
                
            });


            if (IPPR.states.mobile){
                $(IPPR.dom.lists.extra).find(IPPR.dom.table).html(finalTable);
                // $(IPPR.dom.lists.extra).find('.OwnedLicenses').html(finalownedLicenses);
                IPPR.dom.additionalInfo.addClass(IPPR.states.hidden);
            } else {
                IPPR.dom.additionalInfo.removeClass(IPPR.states.hidden);
                IPPR.dom.additionalInfo.find(IPPR.dom.table).html(finalTable).removeClass(IPPR.states.hidden);
                // IPPR.dom.additionalInfo.find('.OwnedLicenses').html(finalownedLicenses).removeClass(IPPR.states.hidden);
            }


        } else { // minerals

        }


    };

    // Mobile behaviour of the app
    IPPR.mobile = function(){
        /*
        ** ... Set the desktop to false
        */
        IPPR.states.desktop = false;

        /*
        ** ... unbind the click event on the tabs
        */
        IPPR.dom.tabs.off('click.mobile');

        /*
        ** ... bind the click event on the tabs
        */
        IPPR.dom.tabs.on('click.mobile', function(){

            IPPR.states.filters = false;
            IPPR.dom.filters.searchTrigger.removeClass(IPPR.states.hidden);
            IPPR.dom.filters.searchRemove.removeClass(IPPR.states.visible);
            IPPR.dom.filters.searchRemove.click();
            IPPR.filters.clear();

            /*
            ** ... hide the footer when on mobile view
            */
            setTimeout(function(){
                IPPR.dom.footer.addClass(IPPR.states.hidden);
            }, 400);

            IPPR.map.resetLayers();

            /*
            ** ... set the content to be visible and slide in the content
            */
            IPPR.dom.content.addClass(IPPR.states.active);

            setTimeout(function(){
                IPPR.dom.content.addClass(IPPR.states.animate);
                $.each(IPPR.map.map, function(key,value){
                    if(value){
                        value.invalidateSize();
                    }
                });
            }, 100);

            IPPR.states.view = $(this).data('view');

            if(IPPR.states.view === 'mines'){
                IPPR.dom.mapTrigger.addClass(IPPR.states.active);
            } else {
                IPPR.dom.map.removeClass(IPPR.states.visible);
                $(IPPR.dom.lists.main).find(IPPR.dom.lists.holder).removeClass(IPPR.states.hidden);
                IPPR.dom.mapTrigger.find('.material-icons').html('map');
            }
        });

        /*
        ** ... levels are the main header links (licence<->info), so we check and slide the content to left or right depending on the current level
        */
        $.each(IPPR.dom.levels, function(key, value){
            var level = $(this).data('level');

            $(value).find(IPPR.dom.lists.header).off('click');
            $(value).find(IPPR.dom.lists.header).on('click', function(){
                if (level === 0){ // Inital non selected view
                    IPPR.dom.footer.removeClass(IPPR.states.hidden);
                    IPPR.dom.content.removeClass(IPPR.states.animate);
                    setTimeout(function(){
                        IPPR.dom.content.removeClass(IPPR.states.active);
                    }, 100);
                    IPPR.dom.mapTrigger.removeClass(IPPR.states.active);

                } else if (level === 1){ // 1st list
                    IPPR.dom.dataHolder.css({transform: 'translate(0,0)'});
                    if(IPPR.states.view === 'mines'){
                        IPPR.dom.mapTrigger.addClass(IPPR.states.active);
                    }
                    IPPR.dom.map.removeClass(IPPR.states.hidden);
                    $.each(IPPR.map.map, function(key,value){
                        if(value){
                            value.invalidateSize();
                        }
                    });
                    $(IPPR.dom.lists.extra).addClass(IPPR.states.hidden);
                    $(IPPR.dom.lists.info).addClass(IPPR.states.hidden);

                    if (IPPR.dom.mapTrigger.find('.material-icons').html() === 'map'){
                        $(IPPR.dom.lists.main).find(IPPR.dom.lists.holder).removeClass(IPPR.states.hidden);
                    }

                } else if (level === 2){ // second list
                    IPPR.dom.dataHolder.css({transform: 'translate(-33.3333%,0)'});
                }
            });
        });

        /*
        ** ... show license additional info (orange button)
        */
        $(document).on('click', IPPR.dom.showInfo, function(e){
            e.preventDefault();

            var item = $(this).closest(IPPR.dom.dataHolder).find('.collection-item.is-active');
            IPPR.displayAdditionalInfo(item, 'licence');

            $(IPPR.dom.lists.info).removeClass(IPPR.states.hidden);
            IPPR.dom.dataHolder.css({transform: 'translate(-66.6666%,0)'});
            $(window).scrollTop(0);
        });



        IPPR.states.mobile = true;
    };

    // Desktop behaviour of the app
    IPPR.desktop = function(){

        IPPR.states.mobile = false;
        IPPR.dom.tabs.off('click.desktop');
        $(IPPR.dom.lists.extra).removeClass(IPPR.states.hidden);

        IPPR.dom.tabs.on('click.desktop', function(){

            IPPR.states.filters = false;
            IPPR.dom.filters.searchTrigger.removeClass(IPPR.states.hidden);
            IPPR.dom.filters.searchRemove.removeClass(IPPR.states.visible);
            IPPR.dom.filters.searchRemove.click();
            IPPR.filters.clear();

            IPPR.map.resetLayers();

            /*
            ** ... we need to reset the leaflet state so it repositions the map view
            */
            setTimeout(function(){
                $.each(IPPR.map.map, function(key,value){
                    if(value){
                        value.invalidateSize();
                    }
                });
            },100);
            IPPR.states.view = $(this).data('view');
            IPPR.dom.additionalInfo.addClass(IPPR.states.hidden);
        });

        /*
        ** ... enable the map to be draggable
        */
        $.each(IPPR.map.map, function(k,v){
            v.dragging.enable();
        });

        IPPR.states.desktop = true;
    };

    /*
    ** On each clicked item in the lists do something ...
    */
    IPPR.listDetails = function(){

        var markup = [],
            mustacheTpl = [];

        $.each(IPPR.data.tabs, function(key){

            mustacheTpl[key] = $('#tab-'+key).find('.extra-tpl').html();

            $('#tab-'+key).on('click', '.collection-item', function(){

                if (IPPR.states.filters){
                    IPPR.map.searchLayers(IPPR.states.view);
                }

                markup[key] = '';

                IPPR.dom.mapTrigger.removeClass(IPPR.states.active);

                $(this).parent().find('li').removeClass(IPPR.states.active);
                $(this).addClass(IPPR.states.active);

                if (IPPR.states.mobile){
                    IPPR.dom.dataHolder.css({transform: 'translate(-33.3333%,0)'});
                    if(IPPR.states.view === 'mines'){
                        IPPR.dom.map.addClass(IPPR.states.hidden);
                    } else {
                        IPPR.dom.mapInline.removeClass(IPPR.states.hidden);
                    }
                    $(window).scrollTop(0);
                } else {
                    IPPR.dom.map.removeClass(IPPR.states.hidden);
                }

                var id = $(this).data('id'),
                    size = 0;

                if(!$(this).closest(IPPR.dom.lists.extra).size()){

                    if (IPPR.states.view === 'companies') {
                        IPPR.states.highlight = 'companies';
                    } else if (IPPR.states.view === 'mines') {
                        IPPR.states.highlight = 'mines';
                    } else {
                        IPPR.states.highlight = 'minerals';
                    }


                    if(IPPR.states.desktop){

                        if(IPPR.states.view === 'mines'){
                            IPPR.displayAdditionalInfo($(this), 'mine');
                        } else if(IPPR.states.view === 'minerals'){
                            IPPR.displayAdditionalInfo($(this), 'minerals');
                        } else {
                            IPPR.displayAdditionalInfo($(this), 'company');
                        }

                    } else {
                        $(this).closest(IPPR.dom.lists.holder).addClass(IPPR.states.hidden);
                        if(IPPR.states.view !== 'mines'){
                            IPPR.displayAdditionalInfo($(this), 'company');
                        }
                    }

                    var companies = [],
                        minerals = [];

                    $.each(IPPR.data.data[key][id], function(k, company){

                        if (IPPR.states.view === 'companies'){
                            companies.push(company);
                        } else if (IPPR.states.view === 'minerals') {
                            minerals.push(company);
                        } else {

                            Mustache.parse(mustacheTpl[key]);

                            markup[key] += Mustache.render(
                                mustacheTpl[key], {
                                    active: key <= 2 ? true : false,
                                    companyInfo: company
                                }
                            );

                        }

                        size++;

                    });

                    if (IPPR.states.view === 'companies'){

                        $.each(IPPR.helpers.groupBy(companies, 'mine_id'), function(k, value){

                            Mustache.parse(mustacheTpl[key]);

                            markup[key] += Mustache.render(
                                mustacheTpl[key], {
                                    mine_name: k,
                                    minesInfo: value[0]
                                }
                            );

                        });

                        if (IPPR.states.mobile){
                            $.each(IPPR.map.markers[key], function(index, val) {
                                 val.off('click');
                            });

                            $.each(IPPR.map.layers[key], function(index, val) {
                                 val.off('click');
                            });

                            $.each(IPPR.map.map, function(k,v){
                                v.dragging.disable();
                            });

                        }
                    }


                    if (IPPR.states.view === 'minerals'){

                        $.each(IPPR.helpers.groupBy(minerals, 'mineral'), function(k, value){

                            Mustache.parse(mustacheTpl[key]);

                            markup[key] += Mustache.render(
                                mustacheTpl[key], {
                                    mine_name: k,
                                    minesInfo: value
                                }
                            );

                        });

                        if (IPPR.states.mobile){
                            $.each(IPPR.map.markers[key], function(index, val) {
                                 val.off('click');
                            });

                            $.each(IPPR.map.layers[key], function(index, val) {
                                 val.off('click');
                            });

                            $.each(IPPR.map.map, function(k,v){
                                v.dragging.disable();
                            });

                        }
                    }



                    $('#tab-'+key).find(IPPR.dom.lists.extra).removeClass(IPPR.states.hidden);
                    $('#tab-'+key).find(IPPR.dom.lists.extra).find(IPPR.dom.lists.list).html(markup[key]);
                    $('#tab-'+key).find(IPPR.dom.lists.extra).find(IPPR.dom.lists.count).html('('+size+')');

                    $('#tab-'+key).find(IPPR.dom.lists.headerActive).removeClass(IPPR.states.hidden);
                    $('#tab-'+key).find(IPPR.dom.lists.headerInActive).addClass(IPPR.states.hidden);

                    IPPR.map.map[key].invalidateSize();

                } else {
                    IPPR.states.highlight = 'mines';
                }

                
                if(IPPR.states.desktop){
                    if (key === '1'){
                        IPPR.map.highlightLayer('2',id);
                    } else if(key === '2'){
                        IPPR.map.highlightLayer('4', id);    
                    } else {
                        IPPR.map.highlightLayer(key,id);
                    }
                } else {
                    IPPR.map.highlightLayer(key,id);
                }

                $('.collapsible').collapsible({
                    accordion : true
                });

            });

        });

    };


    IPPR.filtering = function(){

        $.each(IPPR.data.tabs, function(key){
            IPPR.filters.list.push(new List('tab-'+key, IPPR.filters.options));// jshint ignore:line

            $('#tab-'+key).find(IPPR.dom.filters.item).on('click', function() {

                IPPR.states.filters = true;

                if ($(this).is('.'+IPPR.states.active)){
                    IPPR.filters.list[key].filter();
                    $(this).closest(IPPR.dom.filters.main).find('.chip').removeClass(IPPR.states.active);
                    if(IPPR.states.mobile){
                        IPPR.filters.clear();
                        IPPR.map.resetLayers();
                    }
                } else {

                    var value = $(this).data('filter');

                    $(this).closest(IPPR.dom.filters.main).find('.chip').removeClass(IPPR.states.active);
                    $(this).addClass(IPPR.states.active);

                    if(IPPR.states.mobile){
                        IPPR.dom.filters.search.addClass(IPPR.states.hidden);
                        var clone = $(this).clone();
                        IPPR.dom.filters.activeHolder.html(clone);
                    }

                    IPPR.filters.list[key].filter(function (item) {
                        if (item.values()[value]){
                            return true;
                        }
                        return false;
                    });

                    IPPR.map.searchLayers(IPPR.states.view);
                }
            });


        });


        $.each(IPPR.filters.list, function(index, val) {
            val.on('updated', function(){
                IPPR.map.searchLayers(IPPR.states.view);
            });
        });

        $('.'+IPPR.filters.options.searchClass).on('keyup', function(){
            if ($(this).val()){
                IPPR.states.filters = true;
                IPPR.dom.filters.searchTrigger.addClass(IPPR.states.hidden);
                IPPR.dom.filters.searchRemove.addClass(IPPR.states.visible);
            } else {
                IPPR.states.filters = false;
                IPPR.dom.filters.searchTrigger.removeClass(IPPR.states.hidden);
                IPPR.dom.filters.searchRemove.removeClass(IPPR.states.visible);
            }
        });


        IPPR.dom.filters.searchRemove.on('click', function(){
            IPPR.map.resetLayers();
            $('.'+IPPR.filters.options.searchClass).val('').trigger('keyup').blur();
            $.each(IPPR.filters.list, function(k){
                IPPR.filters.list[k].search();
            });
            IPPR.states.filters = false;
            IPPR.dom.filters.searchTrigger.removeClass(IPPR.states.hidden);
            IPPR.dom.filters.searchRemove.removeClass(IPPR.states.visible);
            $(IPPR.dom.lists.main+':visible').find('.collection-item').removeClass(IPPR.states.active);
        });


        if(IPPR.states.mobile){
            IPPR.dom.filters.activeHolder.on('click', '.chip', function(){
                IPPR.filters.clear();
                IPPR.map.resetLayers();
            });
        }
    };


    IPPR.mapTrigger = function(){

        IPPR.dom.mapTrigger.on('click', function(e){
            e.preventDefault();

            if (IPPR.states.mobile){
                $(IPPR.dom.lists.main).find(IPPR.dom.lists.holder).toggleClass(IPPR.states.hidden);
            }

            IPPR.dom.map.toggleClass(IPPR.states.visible);

            $.each(IPPR.map.map, function(key,value){
                if(value){
                    value.invalidateSize();
                    value.dragging.enable();
                }
            });

            if($(IPPR.dom.lists.main).find(IPPR.dom.lists.holder).is('.'+IPPR.states.hidden) || IPPR.dom.dataHolder.is('.'+IPPR.states.hidden)){
                IPPR.states.map = true;
                $(this).find('.material-icons').html('view_list');
            } else {
                $(this).find('.material-icons').html('map');
            }
        });

    };


    IPPR.initApp = function(){
        if(U.vw() < 993){
            if (!IPPR.states.mobile){
                IPPR.mobile();
            }
        } else {
            if (!IPPR.states.desktop){
                IPPR.desktop();
            }
        }

        IPPR.listDetails();
    };






    IPPR.sankey = function(sankeyData, sankeyElem){


        var _self = {
            draw: function(){

                var data = new google.visualization.DataTable();

                data.addColumn('string', 'From');
                data.addColumn('string', 'To');
                data.addColumn('number', '');
                data.addColumn({type:'string', role:'tooltip'});
                data.addRows(sankeyData);

                var colors = ['#7E9669', '#256A9A'];

                // Sets chart options.
                var options = {
                    width: '100%',
                    height: 400,
                    sankey: {
                        node: {
                            colors: colors,
                            width: 5,
                            nodePadding: 150
                        },
                        link: {
                            colorMode: 'gradient',
                            colors: colors
                        }
                    }
                };

                // Instantiates and draws our chart, passing in some options.
                var chart = new google.visualization.Sankey(document.querySelector(sankeyElem));

                chart.draw(data, options);
            }
        };

        _self.draw();

        // google.charts.setOnLoadCallback(_self.draw);

        U.addEvent(window, 'resize', U.debounce(function () {
            _self.draw();
        }, 200));

    };




    if ($('body').is('.App')){

        IPPR.getData();
        IPPR.initMap();
        IPPR.initApp();
        IPPR.mapTrigger();
        U.addEvent(window, 'resize', U.debounce(function () {
            IPPR.initApp();
        }, 200));


        if (window.location.hash){
            $('.Header-tabs a[href="/'+window.location.hash+'"]').click();
        }

    }



    $('.js-dropdown-trigger').dropdown({
        inDuration: 300,
        outDuration: 225,
        constrain_width: false, // Does not change width of dropdown to that of the activator
        hover: false, // Activate on hover
        gutter: 0, // Spacing from edge
        belowOrigin: true, // Displays dropdown below the button
        alignment: 'right' // Displays dropdown with edge aligned to the left of button
    });


})(window.burza.utils, jQuery);
