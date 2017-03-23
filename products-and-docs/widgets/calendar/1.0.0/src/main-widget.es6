
class TicketmasterCalendarWidget {

    set config(attrs) { this.widgetConfig = this.loadConfig(attrs); }

    get config() { return this.widgetConfig; }

    set events(responce){ this.eventsList = this.parseEvents(responce);}

    get events(){ return this.eventsList;}

    get borderSize(){ return this.config.border || 0;}

    get widgetHeight(){ return this.config.height || 600;}

    get widgetContentHeight() {
        /* return this.widgetHeight - (this.isListView || this.isSimpleProportionM ? 0 : 39) || 600; */
        return this.widgetHeight - 70;
    }

    get eventUrl(){ return "http://www.ticketmaster.com/event/"; }

    get apiUrl(){ return "https://app.ticketmaster.com/discovery/v2/events.json"; }

    get themeUrl() {
        return (window.location.host === 'developer.ticketmaster.com')
          ? `http://developer.ticketmaster.com/products-and-docs/widgets/calendar/1.0.0/theme/`
          : `https://ticketmaster-api-staging.github.io/products-and-docs/widgets/calendar/1.0.0/theme/`;
    }

    get portalUrl(){
        return (window.location.host === 'developer.ticketmaster.com')
          ? `http://developer.ticketmaster.com/`
          : `https://ticketmaster-api-staging.github.io/`;
    }

    get logoUrl() { return "http://www.ticketmaster.com/"; }

    get legalNoticeUrl() { return "http://developer.ticketmaster.com/support/terms-of-use/"; }

    get questionUrl() { return "http://developer.ticketmaster.com/support/faq/"; }

    get widgetVersion() { return `${__VERSION__}`; }

    get geocodeUrl() { return "https://maps.googleapis.com/maps/api/geocode/json"; }

    get updateExceptions() { return ["width", "height", "border", "borderradius", "colorscheme", "layout", "affiliateid", "propotion", "googleapikey"]}

    get sliderDelay(){ return 5000; }

    get sliderRestartDelay(){ return 5000; }

    get hideMessageDelay(){ return 5000; }

    get controlHiddenClass(){ return "events_control-hidden"; }

    get tmWidgetWhiteList(){ return ["2200504BAD4C848F", "00005044BDC83AE6", "1B005068DB60687F", "1B004F4DBEE45E47", "3A004F4ED7829D5E", "3A004F4ED1FC9B63", "1B004F4FF83289C5", "1B004F4FC0276888", "0E004F4F3B7DC543", "1D004F4F09C61861", "1600505AC9A972A1", "22004F4FD82795C6", "01005057AFF54574", "01005056FAD8793A", "3A004F4FB2453240", "22004F50D2149AC6", "01005059AD49507A", "01005062B4236D5D"]; }

    get countriesWhiteList() {
        return [
            'Australia',
            'Austria',
            'Belgium',
            'Canada',
            'Denmark',
            'Finland',
            'France',
            'Germany',
            'Ireland',
            'Mexico',
            'Netherlands',
            'New Zealand',
            'Norway',
            'Spain',
            'Sweden',
            'Turkey',
            'UAE',
            'United Kingdom',
            'United States'
        ]
    }

    isConfigAttrExistAndNotEmpty(attr) {
        if( !this.config.hasOwnProperty(attr) || this.config[attr] === "undefined"){
            return false;
        }else if( this.config[attr] === ""){
            return false;
        }
        return true;
    }

    get eventReqAttrs(){
        let attrs = {},
            params = [
                {
                    attr: 'tmapikey',
                    verboseName: 'apikey'
                },
                {
                    attr: 'keyword',
                    verboseName: 'keyword'
                },
                {
                    attr: 'size',
                    verboseName: 'size'
                },
                {
                    attr: 'radius',
                    verboseName: 'radius'
                },
                {
                    attr: 'classificationid',
                    verboseName: 'classificationId'
                },
                {
                    attr: 'attractionid',
                    verboseName: 'attractionId'
                },
                {
                    attr: 'promoterid',
                    verboseName: 'promoterId'
                },
                {
                    attr: 'venueid',
                    verboseName: 'venueId'
                },
                {
                    attr: 'city',
                    verboseName: 'city'
                },
                {
                    attr: 'countrycode',
                    verboseName: 'countryCode'
                },
                {
                    attr: 'segmentid',
                    verboseName: 'segmentId'
                }
            ];

        for(let i in params){
            let item = params[i];
            if(this.isConfigAttrExistAndNotEmpty(item.attr))
                attrs[item.verboseName] = this.config[item.attr];
        }

        // Only one allowed at the same time
        if(this.config.latlong){
            attrs.latlong = this.config.latlong;
            if (this.widgetRoot.getAttribute('w-postalcodeapi') != null) {
                this.config.latlong = '';
            }
            if (this.widgetRoot.getAttribute('w-latlong') != null && this.widgetRoot.getAttribute('w-latlong') != '34.0390107,-118.2672801') {
                attrs.latlong = this.widgetRoot.getAttribute('w-latlong');
                attrs.postalCode = '';
                this.config.postalcode = '';
            }
        } else {
            if(this.isConfigAttrExistAndNotEmpty("postalcode"))
                attrs.postalCode = this.config.postalcode;
        }

        if (this.config.countrycode != null) {
            attrs.latlong = '';
            this.config.latlong = '';
            this.widgetRoot.setAttribute('w-latlong', '');
        }

        if(this.isConfigAttrExistAndNotEmpty("period")){
            let period = this.getDateFromPeriod(this.config.period);
            attrs.startDateTime = period[0];
            attrs.endDateTime = period[1];
        }

        if (this.config.period != 'week') {
            let period_ = new Date(this.config.period);
            let firstDay = new Date(period_);
            let lastDay = new Date(period_);
            firstDay.setDate(firstDay.getDate() + 1);
            lastDay.setDate(lastDay.getDate() + 1);
            firstDay.setHours(0);   lastDay.setHours(23);
            firstDay.setMinutes(0); lastDay.setMinutes(59);
            firstDay.setSeconds(0); lastDay.setSeconds(59);
            attrs.startDateTime = this.toShortISOString(firstDay);
            attrs.endDateTime = this.toShortISOString(lastDay);
        }

        return attrs;
    }

    constructor(root) {
        if(!root) return;
        this.widgetRoot = root;

        if (this.widgetRoot.querySelector('.tabs-container') != null) return;

        this.tabsRootContainer = document.createElement("div");
        this.tabsRootContainer.classList.add("tabs");
        this.tabsRootContainer.innerHTML = '<span class="tb active">Day</span><span class="tb">Week</span><span class="tb">Month</span><span class="tb">Year</span>';
        this.widgetRoot.appendChild(this.tabsRootContainer);

        this.tabsRootContainer = document.createElement("div");
        this.tabsRootContainer.classList.add("tabs-container");
        this.widgetRoot.appendChild(this.tabsRootContainer);

        this.tab1RootContainer = document.createElement("div");
        this.tab1RootContainer.classList.add("tab");
        this.tab1RootContainer.classList.add("active");
        this.tabsRootContainer.appendChild(this.tab1RootContainer);

        let leftSelector = new SelectorControls(this.tab1RootContainer, 'sliderLeftSelector', this.getCurrentWeek(), 'period', this.update.bind(this));
        let RightSelector = new SelectorControls(this.tab1RootContainer, 'sliderRightSelector', '<span class="selector-title">All Events</span><span class="selector-content" tabindex="-1"><span class="active" w-classificationId="">All Events</span><span w-classificationId="KZFzniwnSyZfZ7v7na">Arts & Theatre</span><span w-classificationId="KZFzniwnSyZfZ7v7nn">Film</span><span w-classificationId="KZFzniwnSyZfZ7v7n1">Miscellaneous</span><span w-classificationId="KZFzniwnSyZfZ7v7nJ">Music</span><span w-classificationId="KZFzniwnSyZfZ7v7nE">Sports</span></span>', 'classificationId', this.update.bind(this));



        this.tab2RootContainer = document.createElement("div");
        this.tab2RootContainer.classList.add("tab");
        this.tab2RootContainer.innerHTML = '<div class="weekSсheduler"><div class="spinner-container"><div class="spinner"><div class="rect1"></div><div class="rect2"></div><div class="rect3"></div><div class="rect4"></div><div class="rect5"></div></div></div>';
        this.tabsRootContainer.appendChild(this.tab2RootContainer);
        this.eventLogoBox = document.createElement("div");
        this.eventLogoBox.classList.add("event-logo-box-c");
        this.eventLogoBox.innerHTML = '<a class="event-logo-c" target="_blank" href="http://www.ticketmaster.com/">Powered by:</a>';
        this.tab2RootContainer.appendChild(this.eventLogoBox);


        this.tab3RootContainer = document.createElement("div");
        this.tab3RootContainer.classList.add("tab");
        this.tab3RootContainer.innerHTML = '<div class="monthScheduler"><div class="spinner-container"><div class="spinner"><div class="rect1"></div><div class="rect2"></div><div class="rect3"></div><div class="rect4"></div><div class="rect5"></div></div></div>';
        this.tabsRootContainer.appendChild(this.tab3RootContainer);
        this.eventLogoBox = document.createElement("div");
        this.eventLogoBox.classList.add("event-logo-box-c");
        this.eventLogoBox.innerHTML = '<a class="event-logo-c" target="_blank" href="http://www.ticketmaster.com/">Powered by:</a>';
        this.tab3RootContainer.appendChild(this.eventLogoBox);

        this.tab4RootContainer = document.createElement("div");
        this.tab4RootContainer.classList.add("tab");
        this.tab4RootContainer.innerHTML = '<div class="yearScheduler"><div class="spinner-container"><div class="spinner"><div class="rect1"></div><div class="rect2"></div><div class="rect3"></div><div class="rect4"></div><div class="rect5"></div></div></div>';
        this.tabsRootContainer.appendChild(this.tab4RootContainer);
        this.eventLogoBox = document.createElement("div");
        this.eventLogoBox.classList.add("event-logo-box-c");
        this.eventLogoBox.innerHTML = '<a class="event-logo-c" target="_blank" href="http://www.ticketmaster.com/">Powered by:</a>';
        this.tab4RootContainer.appendChild(this.eventLogoBox);

        this.eventsRootContainer = document.createElement("div");
        this.eventsRootContainer.classList.add("events-root-container");
        this.eventsRootContainer.innerHTML = '<div class="spinner-container"><div class="spinner"><div class="rect1"></div><div class="rect2"></div><div class="rect3"></div><div class="rect4"></div><div class="rect5"></div></div></div>';
        this.tab1RootContainer.appendChild(this.eventsRootContainer);

        this.eventsRoot = document.createElement("ul");
        this.eventsRoot.classList.add("events-root");
        this.eventsRootContainer.appendChild(this.eventsRoot);

        this.config = this.widgetRoot.attributes;

        if(this.config.theme !== null && !document.getElementById(`widget-theme-${this.config.theme}`)){
            this.makeRequest( this.styleLoadingHandler, this.themeUrl + this.config.theme + ".css" );
        }

        this.eventsRootContainer.classList.remove("border");
        if(this.config.border){
            this.eventsRootContainer.classList.add("border");
        }

        this.widgetRoot.style.height = `${this.widgetHeight}px`;
        this.widgetRoot.style.width  = `${this.config.width}px`;

        this.eventsRootContainer.style.height = `${this.widgetContentHeight}px`;
        this.eventsRootContainer.style.width  = `${this.config.width}px`;
        this.eventsRootContainer.style.borderWidth = `0`;
        this.widgetRoot.style.borderRadius = `${this.config.borderradius}px`;
        this.widgetRoot.style.borderWidth = `${this.borderSize}px`;

        //this.clear();

        this.AdditionalElements();

        this.getCoordinates(() => {
            this.makeRequest( this.eventsLoadingHandler, this.apiUrl, this.eventReqAttrs );
        });

        /*plugins for 'buy button'*/
        this.embedUniversePlugin();
        this.embedTMPlugin();

        this.initBuyBtn();

        this.initMessage();

        this.initSliderControls();

        /* if (!this.isListView) this.initEventCounter(); */
    }

    getCurrentWeek() {
        let monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        let content = '<span class="selector-title">';
        let today = new Date();
        let todayTmp = new Date();
        content += monthNames[today.getMonth()] + ' ' + today.getDate();
        content += '</span>';
        content += '<span class="selector-content" tabindex="-1">';

        for (var d=0; d<=6; d++) {
            todayTmp.setDate(today.getDate() + d);
            if (d == 0) content += `<span class="active" w-period="${todayTmp}">`;
            else content += `<span w-period="${todayTmp}">`;
            content += monthNames[todayTmp.getMonth()] + ' ' + todayTmp.getDate();
            content += '</span>';
            todayTmp = new Date();
        }
        content += '</span>';
        return content;
    }

    getCoordinates(cb){
        let widget = this;

        function parseGoogleGeocodeResponse(){
            if (this && this.readyState === XMLHttpRequest.DONE ) {
                let latlong = '',
                    results = null,
                    countryShortName = '';
                if(this.status === 200) {
                    let response = JSON.parse(this.responseText);
                    if (response.status === 'OK' && response.results.length) {
                        // Filtering only white list countries
                        results = response.results.filter((item) => {
                            return widget.countriesWhiteList.filter((elem) => {
                                    return elem === item.address_components[item.address_components.length - 1].long_name;
                                }).length > 0;
                        });

                        if (results.length) {
                            // sorting results by country name
                            results.sort((f, g) => {
                                let a = f.address_components[f.address_components.length - 1].long_name;
                                let b = g.address_components[g.address_components.length - 1].long_name;
                                if (a > b) {
                                    return 1;
                                }
                                if (a < b) {
                                    return -1;
                                }
                                return 0;
                            });

                            // Use first item if multiple results was found in one country or in different
                            let geometry = results[0].geometry;
                            countryShortName = results[0].address_components[results[0].address_components.length - 1].short_name;

                            // If multiple results without country try to find USA as prefer value
                            if (!widget.config.country) {
                                for (let i in results) {
                                    let result = results[i];
                                    if (result.address_components) {
                                        let country = result.address_components[result.address_components.length - 1];
                                        if (country) {
                                            if (country.short_name === 'US') {
                                                countryShortName = 'US';
                                                geometry = result.geometry;
                                            }
                                        }
                                    }
                                }
                            }

                            if (geometry) {
                                if (geometry.location) {
                                    latlong = `${geometry.location.lat},${geometry.location.lng}`;
                                }
                            }
                        } else {
                            results = null;
                        }
                    }
                }
                if(widget.onLoadCoordinate) widget.onLoadCoordinate(results, countryShortName);
                widget.config.latlong = latlong;
                if (widget.config.latlong == null) widget.config.latlong = "34.0390107,-118.2672801";
                if (document.querySelector('[w-type="calendar"]').getAttribute("w-country") != null) {
                    widget.config.latlong = '';
                    latlong = '';
                };
                cb(widget.config.latlong);
                document.querySelector('[w-type="calendar"]').setAttribute("w-latlong", latlong);
            }
        }

        if(this.isConfigAttrExistAndNotEmpty('postalcode')){
            let args = {language: 'en', components: `postal_code:${widget.config.postalcode}`};
            if(widget.config.googleapikey) args.key = widget.config.googleapikey;
            if(this.config.country) args.components += `|country:${this.config.country}`;
            this.makeRequest( parseGoogleGeocodeResponse, this.geocodeUrl, args);
        }else{
            // Used in builder
            if(widget.onLoadCoordinate) widget.onLoadCoordinate(null);
            widget.config.latlong = '34.0390107,-118.2672801';
            widget.config.country = 'US';
            cb(widget.config.latlong);
            if (document.getElementById('w-keyword').value != '') {
                document.querySelector('[w-type="calendar"]').setAttribute("w-latlong", '');
            }
        }
    }

    initBuyBtn(){
        this.buyBtn = document.createElement("a");
        this.buyBtn.appendChild(document.createTextNode('BUY NOW'));
        this.buyBtn.classList.add("event-buy-btn");
        this.buyBtn.classList.add("main-btn");
        this.buyBtn.target = '_blank';
        this.buyBtn.href = '';
        this.buyBtn.setAttribute('onclick', "ga('send', 'event', 'DiscoveryClickBuyButton', 'click');");
        this.buyBtn.addEventListener('click', (e)=> {
            e.preventDefault(); /*used in plugins for 'buy button'*/
            this.stopAutoSlideX();
        });
        this.eventsRootContainer.appendChild(this.buyBtn);
    }

    setBuyBtnUrl(){
        if(this.buyBtn){
            let event = this.eventsGroups[this.currentSlideX][this.currentSlideY],
                url = '';
            if(event){
                if(event.url){

                    if((this.isUniversePluginInitialized && this.isUniverseUrl(event.url)) || (this.isTMPluginInitialized && this.isAllowedTMEvent(event.url))){
                        url = event.url;
                    }
                }
            }
            this.buyBtn.href = url;
        }
    }

    isUniverseUrl(url){
        return (url.match(/universe.com/g) || url.match(/uniiverse.com/g));
    }

    isAllowedTMEvent(url){
        for (var t = [/(?:ticketmaster\.com)\/(.*\/)?event\/([^\/?#]+)/, /(?:concerts\.livenation\.com)\/(.*\/)?event\/([^\/?#]+)/], n = null, r = 0; r < t.length && (n = url.match(t[r]), null === n); r++);
        let id = (null !== n ? n[2] : void 0);
        return (this.tmWidgetWhiteList.indexOf(id) > -1);
    }

    embedTMPlugin(){
        let id = 'id_tm_widget';
        if( !document.getElementById(id) ) {
            let script = document.createElement('script');
            script.setAttribute('src', this.portalUrl + 'scripts/vendors/tm.js');
            script.setAttribute('type', 'text/javascript');
            script.setAttribute('charset', 'UTF-8');
            script.setAttribute('id', id);
            (document.head || document.getElementsByTagName('head')[0]).appendChild(script);
        }
        this.isTMPluginInitialized = true;
    }

    embedUniversePlugin(){
        let id = 'id_universe_widget';
        if( !document.getElementById(id) ){
            let script = document.createElement('script');
            script.setAttribute('src', 'https://www.universe.com/embed.js');
            script.setAttribute('type', 'text/javascript');
            script.setAttribute('charset', 'UTF-8');
            script.setAttribute('id', id);
            (document.head || document.getElementsByTagName('head')[0]).appendChild(script);
        }
        this.isUniversePluginInitialized = true;
    }

    initMessage(){
        this.messageDialog = document.createElement('div');
        this.messageDialog.classList.add("event-message");
        this.messageContent = document.createElement('div');
        this.messageContent.classList.add("event-message__content");

        let messageClose = document.createElement('div');
        messageClose.classList.add("event-message__btn");
        messageClose.addEventListener("click", ()=> {
            this.hideMessage();
        });

        this.messageDialog.appendChild(this.messageContent);
        this.messageDialog.appendChild(messageClose);
        this.eventsRootContainer.appendChild(this.messageDialog);
    }

    showMessage(message, hideMessageWithoutDelay){
        if(message.length){
            this.hideMessageWithoutDelay = hideMessageWithoutDelay;
            this.messageContent.innerHTML = message;
            this.messageDialog.classList.add("event-message-visible");
            if (this.messageTimeout) {
                clearTimeout(this.messageTimeout); // Clear timeout if before 'hideMessageWithDelay' was called
            }
        }
    }

    hideMessageWithDelay(delay){
        if(this.messageTimeout) clearTimeout(this.messageTimeout); // Clear timeout if this method was called before
        this.messageTimeout = setTimeout(()=>{
            this.hideMessage();
        }, delay);
    }

    hideMessage(){
        if(this.messageTimeout) clearTimeout(this.messageTimeout); // Clear timeout and hide message immediately.
        this.messageDialog.classList.remove("event-message-visible");
    }

    AdditionalElements(){
        /*
        var legalNoticeContent = document.createTextNode('Legal Notice'),
            legalNotice = document.createElement("a");
        legalNotice.appendChild(legalNoticeContent);
        legalNotice.classList.add("legal-notice");
        legalNotice.target = '_blank';
        legalNotice.href = this.legalNoticeUrl;
        this.widgetRoot.appendChild(legalNotice);
        */
        var logo = document.createElement('a');
        logo.classList.add("event-logo");
        logo.target = '_blank';
        logo.href = this.logoUrl;
        logo.innerHTML = 'Powered by:';

        var logoBox = document.createElement('div');
        logoBox.classList.add("event-logo-box");
        logoBox.appendChild(logo);
        this.eventsRootContainer.appendChild(logoBox);

        let question = document.createElement('span');
        question.classList.add("event-question");
        question.target = '_blank';
        question.href = this.questionUrl;
        question.addEventListener('click', toolTipHandler);
        this.widgetRoot.appendChild(question);

        let toolTip = document.createElement('div'),
            tooltipHtml = `
              <div class="tooltip-inner"> 
                <a href="${this.questionUrl}" target = "_blank" >About widget</a>
                <div class="place">version: <b>${this.widgetVersion}</b></div>
              </div>`;
        toolTip.classList.add("tooltip-version");
        toolTip.classList.add("left");
        toolTip.innerHTML = tooltipHtml;
        this.widgetRoot.appendChild(toolTip);

        function toolTipHandler(e) {
            e.preventDefault();
            e.target.nextSibling.classList.toggle('show-tip');
        }
    }

    hideSliderControls(){
        this.prevEventX.classList.add(this.controlHiddenClass);
        this.nextEventX.classList.add(this.controlHiddenClass);
        this.prevEventY.classList.add(this.controlHiddenClass);
        this.nextEventY.classList.add(this.controlHiddenClass);
    }

    toggleControlsVisibility(){
        // Horizontal
        if(this.slideCountX > 1){
            this.prevEventX.classList.remove(this.controlHiddenClass);
            this.nextEventX.classList.remove(this.controlHiddenClass);
            if(this.currentSlideX === 0){
                this.prevEventX.classList.add(this.controlHiddenClass);
            }else if(this.currentSlideX === this.slideCountX - 1){
                this.nextEventX.classList.add(this.controlHiddenClass);
            }
        }else{
            this.prevEventX.classList.add(this.controlHiddenClass);
            this.nextEventX.classList.add(this.controlHiddenClass);
        }

        // Vertical
        if(this.eventsGroups.length){
            if(this.eventsGroups[this.currentSlideX].length > 1){
                this.prevEventY.classList.remove(this.controlHiddenClass);
                this.nextEventY.classList.remove(this.controlHiddenClass);
                if(this.currentSlideY === 0){
                    this.prevEventY.classList.add(this.controlHiddenClass);
                }else if(this.currentSlideY === this.eventsGroups[this.currentSlideX].length - 1){
                    this.nextEventY.classList.add(this.controlHiddenClass);
                }
            }else{
                this.prevEventY.classList.add(this.controlHiddenClass);
                this.nextEventY.classList.add(this.controlHiddenClass);
            }
        }else{
            this.prevEventY.classList.add(this.controlHiddenClass);
            this.nextEventY.classList.add(this.controlHiddenClass);
        }
    }

    prevSlideX(){
        if(this.currentSlideX > 0){
            this.setSlideManually(this.currentSlideX - 1, true);
        }
    }

    nextSlideX(){
        if(this.slideCountX - 1 > this.currentSlideX) {
            this.setSlideManually(this.currentSlideX + 1, true);
        }
    }

    prevSlideY(){
        if(this.currentSlideY > 0){
            this.setSlideManually(this.currentSlideY - 1, false);
        }
    }

    nextSlideY(){
        if(this.eventsGroups[this.currentSlideX].length - 1 > this.currentSlideY) {
            this.setSlideManually(this.currentSlideY + 1, false);
        }
    }

    setSlideManually(slideIndex, isDirectionX){
        this.stopAutoSlideX();
        this.sliderTimeout = setTimeout(()=>{
            this.runAutoSlideX();
        }, this.sliderRestartDelay);
        if(isDirectionX)
            this.goToSlideX(slideIndex);
        else
            this.goToSlideY(slideIndex);
    }

    goToSlideX(slideIndex){
        if(this.currentSlideX === slideIndex) return;
        this.currentSlideY = 0;
        this.currentSlideX = slideIndex;
        this.eventsRoot.style.marginLeft = `-${this.currentSlideX * 100}%`;
        this.toggleControlsVisibility();
        this.setEventsCounter();
        this.setBuyBtnUrl();
    }

    goToSlideY(slideIndex){
        if(this.currentSlideY === slideIndex) return;
        this.currentSlideY = slideIndex;
        let eventGroup = this.eventsRoot.getElementsByClassName("event-group-" + this.currentSlideX);
        if(eventGroup.length){
            eventGroup = eventGroup[0];
            eventGroup.style.marginTop = `-${this.currentSlideY * (this.widgetContentHeight - this.borderSize * 2)}px`;
            this.toggleControlsVisibility();
            this.setBuyBtnUrl();
        }
    }

    runAutoSlideX(){
        if(this.slideCountX > 1) {
            this.sliderInterval = setInterval(()=> {
                var slideIndex = 0;
                if (this.slideCountX - 1 > this.currentSlideX) slideIndex = this.currentSlideX + 1;
                this.goToSlideX(slideIndex);
            }, this.sliderDelay);
        }
    }

    stopAutoSlideX(){
        if(this.sliderTimeout) clearTimeout(this.sliderTimeout);
        if(this.sliderInterval) clearInterval(this.sliderInterval);
    }

    initSliderControls(){
        this.currentSlideX = 0;
        this.currentSlideY = 0;
        this.slideCountX = 0;
        let coreCssClass = 'events_control';

        // left btn
        this.prevEventX = document.createElement("div");
        let prevEventXClass = [coreCssClass, coreCssClass + '-horizontal', coreCssClass + '-left', this.controlHiddenClass];
        for(let i in prevEventXClass){
            this.prevEventX.classList.add(prevEventXClass[i]);
        }
        this.eventsRootContainer.appendChild(this.prevEventX);

        // right btn
        this.nextEventX = document.createElement("div");
        let nextEventXClass = [coreCssClass, coreCssClass + '-horizontal', coreCssClass + '-right', this.controlHiddenClass];
        for(let i in nextEventXClass){
            this.nextEventX.classList.add(nextEventXClass[i]);
        }
        this.eventsRootContainer.appendChild(this.nextEventX);

        // top btn
        this.prevEventY = document.createElement("div");
        let prevEventYClass = [coreCssClass, coreCssClass + '-vertical', coreCssClass + '-top', this.controlHiddenClass];
        for(let i in prevEventYClass ){
            this.prevEventY.classList.add(prevEventYClass[i]);
        }
        this.eventsRootContainer.appendChild(this.prevEventY);

        // bottom btn
        this.nextEventY = document.createElement("div");
        let nextEventYClass = [coreCssClass, coreCssClass + '-vertical', coreCssClass + '-bottom', this.controlHiddenClass];
        for(let i in nextEventYClass){
            this.nextEventY.classList.add(nextEventYClass[i]);
        }
        this.eventsRootContainer.appendChild(this.nextEventY);

        // Restore events group position
        function whichTransitionEvent(){
            let el = document.createElement('fakeelement'),
                transitions = {
                    'transition':'transitionend',
                    'OTransition':'oTransitionEnd',
                    'MozTransition':'transitionend',
                    'WebkitTransition':'webkitTransitionEnd'
                };

            for(let event in transitions){
                if( el.style[event] !== undefined ) return transitions[event];
            }
        }

        var transitionEvent = whichTransitionEvent();
        transitionEvent && this.eventsRoot.addEventListener(transitionEvent, (e)=> {
            if (this.eventsRoot !== e.target) return;
            let eventGroup = this.eventsRoot.getElementsByClassName("event-group");
            // Reset all groups. We don't know what event group was visible before.
            for(let i = 0; eventGroup.length > i; i++){
                eventGroup[i].style.marginTop = 0;
            }
        });

        // Arrows
        this.prevEventX.addEventListener("click", ()=> {
            this.prevSlideX();
        });

        this.nextEventX.addEventListener("click", ()=> {
            this.nextSlideX();
        });

        this.prevEventY.addEventListener("click", ()=> {
            this.prevSlideY();
        });

        this.nextEventY.addEventListener("click", ()=> {
            this.nextSlideY();
        });

        // Tough device swipes
        let xDown = null,
            yDown = null;

        function handleTouchStart(evt) {
            xDown = evt.touches[0].clientX;
            yDown = evt.touches[0].clientY;
        }

        function handleTouchMove(evt) {
            if ( ! xDown || ! yDown ) return;

            let xUp = evt.touches[0].clientX,
                yUp = evt.touches[0].clientY,
                xDiff = xDown - xUp,
                yDiff = yDown - yUp;

            if ( Math.abs( xDiff ) > Math.abs( yDiff ) ) {
                if ( xDiff > 0 )
                    this.nextSlideX(); // left swipe
                else
                    this.prevSlideX(); // right swipe
            } else {
                if ( yDiff > 0 )
                    this.nextSlideY(); // up swipe
                else
                    this.prevSlideY(); // down swipe
            }

            xDown = null;
            yDown = null;
        }

        this.eventsRootContainer.addEventListener('touchstart', (e)=> {
            if(this.config.theme !== "listview") { if (e.target.className != 'event-logo' && e.target.className != 'event-question') e.preventDefault(); } /*used in plugins for 'buy button'*/
            handleTouchStart.call(this, e);
        }, false);
        this.eventsRootContainer.addEventListener('touchmove', (e)=> {
            if(this.config.theme !== "listview") { if (e.target.className != 'event-logo' && e.target.className != 'event-question') e.preventDefault(); }
            handleTouchMove.call(this, e);
        }, false);
    }

    initSlider(){
        if(this.sliderInterval) clearInterval(this.sliderInterval);
        if(this.sliderTimeout) clearTimeout(this.sliderTimeout);
        this.slideCountX = this.eventsGroups.length;
        this.eventsRoot.style.marginLeft = '0%';
        this.eventsRoot.style.width = `${this.slideCountX * 100}%`;
        this.currentSlideX = 0;
        this.currentSlideY = 0;
        this.runAutoSlideX();
        this.toggleControlsVisibility();
        this.setBuyBtnUrl();
    }

    formatDate(date) {
        var result = '';
        if(!date.day) return result; // Day is required

        function LZ(x) {
            return (x < 0 || x > 9 ? "" : "0") + x
        }
        var MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'],
            DAY_NAMES = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'],
            dayArray = date.day.split('-'),
            d = parseInt(dayArray[2]),
            M = parseInt(dayArray[1]);

        // var E = new Date(date.day).getDay();
        var E = new Date(+date.day.split('-')[0],(+date.day.split('-')[1])-1,+date.day.split('-')[2]).getDay();
        result = DAY_NAMES[E] + ', ' + MONTH_NAMES[M - 1] + ' ' + d + ', ' + dayArray[0];

        if(!date.time) return result;

        var timeArray = date.time.split(':'),
            H = parseInt(timeArray[0]),
            m = timeArray[1],
            a = "AM";

        if (H > 11) a = "PM";
        if (H == 0) {
            H = 12;
        } else if (H > 12) {
            H = H - 12;
        }

        return result + ' ' + LZ(H) + ':' + m + ' ' + a;
    }

    clearEvents(){
        this.eventsRoot.innerHTML = "";
    }

    clear(){
        var modificatorList = this.widgetRoot.getElementsByClassName('modificator');
        while (modificatorList.length) {
            let el = modificatorList[0],
                parent = el.parentNode;
            parent.removeChild(el);
        }

        this.clearEvents();
    }

    update() {
        let widget = this.eventsRootContainer;
        let spinner = widget.querySelector('.spinner-container');
        spinner.classList.remove('hide');
        let oldTheme = this.config.constructor();
        for (let attr in this.config) {
            if (this.config.hasOwnProperty(attr)) oldTheme[attr] = this.config[attr];
        }

        this.config = this.widgetRoot.attributes;

        this.widgetRoot.style.height = `${this.widgetHeight}px`;
        this.widgetRoot.style.width  = `${this.config.width}px`;
        this.widgetRoot.style.borderRadius = `${this.config.borderradius}px`;
        this.widgetRoot.style.borderWidth = `${this.borderSize}px`;

        this.getCurrentWeek();

        this.eventsRootContainer.classList.remove("border");

        widget.querySelector('.events-root-container .spinner-container').classList.add('hide');

        if( this.config.hasOwnProperty("border") ){
            this.eventsRootContainer.classList.add("border");
        }

        if(!this.needToUpdate(this.config, oldTheme, this.updateExceptions) || this.needToUpdate(this.config, oldTheme, this.updateExceptions)){
            this.clear();

            this.getCoordinates(() => {
                this.makeRequest( this.eventsLoadingHandler, this.apiUrl, this.eventReqAttrs );
            });
        }
        else{
            let events = this.eventsRoot.getElementsByClassName("event-wrapper");
            for(let i in events){
                if(events.hasOwnProperty(i) && events[i].style !== undefined){
                    events[i].style.width = `${this.config.width}px`;
                    events[i].style.height = `${this.widgetContentHeight}px`;
                }
            }
                this.goToSlideY(0);
        }
    }

    needToUpdate(newTheme, oldTheme, forCheck = []){
        return Object.keys(newTheme).map(function(key){
                if(forCheck.indexOf(key) > -1) return true;
                //console.warn([key, newTheme[key], oldTheme[key], newTheme[key] === oldTheme[key]])
                return newTheme[key] === oldTheme[key] ;
            }).indexOf(false) > -1
    }

    loadConfig(NamedNodeMap){
        var config = {};
        Object.keys(NamedNodeMap).map(function(value){
            if( typeof(NamedNodeMap[value].name) !== "undefined" && NamedNodeMap[value].name.indexOf("w-") !== -1){
                config[ NamedNodeMap[value].name.replace(/w-/g, "").replace(/-/g, "") ] = NamedNodeMap[value].value;
            }
        });
        return config;
    }

    styleLoadingHandler(){
        if (this && this.readyState == XMLHttpRequest.DONE ) {
            if(this.status == 200){
                var style = document.createElement("style");
                style.setAttribute("type","text/css");
                style.setAttribute("id",`widget-theme-${this.widget.config.theme}`);
                style.textContent = this.responseText;
                document.getElementsByTagName("head")[0].appendChild(style);
            }
            else {
                console.log("theme wasn't loaded");
            }
        }
    }

    groupEventsByName(){
        let groups = {};
        this.events.map(function(event){
            if (groups[event.name] === undefined) groups[event.name] = [];
            groups[event.name].push(event);
        });

        this.eventsGroups = [];
        for (let groupName in groups) {
            this.eventsGroups.push(groups[groupName]);
        }
    }

    initEventCounter(){
        this.eventsCounter = document.createElement("div");
        this.eventsCounter.classList.add("events-counter");
        this.widgetRoot.appendChild(this.eventsCounter);
    }

    setEventsCounter(){
        if(this.eventsCounter){
            let text = '';
            if(this.eventsGroups.length){
                if(this.eventsGroups.length > 1){
                    text = `${this.currentSlideX + 1} of ${this.eventsGroups.length} events`;
                } else {
                    text = '1 event';
                }
            }
            this.eventsCounter.innerHTML = text;
        }
    }

    resetReduceParamsOrder(){
        this.reduceParamsOrder = 0;
    }

    reduceParamsAndReloadEvents(){
        let eventReqAttrs = {},
            reduceParamsList = [
                ['startDateTime', 'endDateTime', 'country'],
                ['city'],
                ['countryCode'],
                ['radius'],
                ['postalCode', 'latlong'],
                ['classificationId'],
                ['attractionId'],
                ['promoterId'],
                ['segmentId'],
                ['venueId'],
                ['keyword'],
                ['size']
            ];

        // make copy of params
        for(let key in this.eventReqAttrs){
            eventReqAttrs[key] = this.eventReqAttrs[key]
        }

        if(!this.reduceParamsOrder) this.reduceParamsOrder = 0;
        if(reduceParamsList.length > this.reduceParamsOrder){
            for(let item in reduceParamsList){
                if(this.reduceParamsOrder >= item){
                    for(let i in reduceParamsList[item]){
                        delete eventReqAttrs[reduceParamsList[item][i]];
                    }
                }
            }

            // if(this.reduceParamsOrder === 0) this.showMessage("No results were found.<br/>Here other options for you.");
            this.reduceParamsOrder++;
            this.makeRequest( this.eventsLoadingHandler, this.apiUrl, eventReqAttrs );
        }else{
            // We haven't any results
            this.showMessage("No results were found.", true);
            this.reduceParamsOrder = 0;
            this.hideSliderControls();
        }
    }

    eventsLoadingHandler(){
        let widget = this.widget;

        let spinner = widget.eventsRootContainer.querySelector('.spinner-container');

        widget.clearEvents(); // Additional clearing after each loading
        if (this && this.readyState == XMLHttpRequest.DONE ) {
            if(this.status == 200){

                spinner.classList.add('hide');

                widget.events = JSON.parse(this.responseText);

                if(widget.events.length){
                    widget.groupEventsByName.call(widget);

                    widget.eventsGroups.map(function(group, i){
                        if(group.length === 1)
                            widget.publishEvent(group[0]);
                        else
                            widget.publishEventsGroup.call(widget, group, i);
                    });

                    widget.initSlider();
                    widget.setEventsCounter();
                    widget.resetReduceParamsOrder();
                    if(widget.hideMessageWithoutDelay)
                        widget.hideMessage();
                    else
                        widget.hideMessageWithDelay(widget.hideMessageDelay);

                }else{
                    widget.reduceParamsAndReloadEvents.call(widget);
                }
            }
            else if(this.status == 400) {
                widget.reduceParamsAndReloadEvents.call(widget);
                console.log('There was an error 400');
            }
            else {
                widget.reduceParamsAndReloadEvents.call(widget);
                console.log('something else other than 200 was returned');
            }
        }
    }

    publishEventsGroup(group, index){
        let groupNodeWrapper = document.createElement("li");
        groupNodeWrapper.classList.add("event-wrapper");
        groupNodeWrapper.classList.add("event-group-wrapper");
        /*
        groupNodeWrapper.style.width  = `${this.config.width - this.borderSize * 2}px`;
        groupNodeWrapper.style.height = `${this.widgetContentHeight - this.borderSize * 2}px`;
        */
        groupNodeWrapper.style.width  = `${this.config.width}px`;
        groupNodeWrapper.style.height = `${this.widgetContentHeight}px`;

        let groupNode = document.createElement("ul");
        groupNode.classList.add("event-group");
        groupNode.classList.add("event-group-" + index);

        group.map((event)=> {
            this.publishEvent(event, groupNode)
        });

        groupNodeWrapper.appendChild(groupNode);
        this.eventsRoot.appendChild(groupNodeWrapper);
    }

    publishEvent(event, parentNode){
        parentNode = parentNode || this.eventsRoot;
        let DOMElement = this.createDOMItem(event);
        parentNode.appendChild(DOMElement);
    }

    getEventByID(id){
        for(let index in this.events){
            if(this.events.hasOwnProperty(index) && this.events[index].id === id){
                return this.events[index]
            }
        }
    }

    getImageForEvent(images){
        var width = this.config.width,
            height = this.widgetContentHeight;

        images.sort(function(a,b) {
            if (a.width < b.width)
                return -1;
            else if (a.width > b.width)
                return 1;
            else
                return 0;
        });

        var myImg = "";
        images.forEach(function(element){
            if(element.width >= width && element.height >= height && !myImg){
                myImg = element.url;
            }
        });
        return myImg;
    }

    parseEvents(eventsSet){
        if(!eventsSet._embedded){
            if(typeof($widgetModalNoCode) !== "undefined"){
                $widgetModalNoCode.modal();
            }
            return [];
        }
        eventsSet = eventsSet._embedded.events;

        var tmpEventSet = [];
        for(var key in eventsSet){
            if(eventsSet.hasOwnProperty(key)){
                let currentEvent = {};

                currentEvent.id = eventsSet[key].id;
                currentEvent.url = eventsSet[key].url;
                currentEvent.name = eventsSet[key].name;

                currentEvent.date = {
                    day: eventsSet[key].dates.start.localDate,
                    time: eventsSet[key].dates.start.localTime
                };

                if(eventsSet[key].hasOwnProperty('_embedded') && eventsSet[key]._embedded.hasOwnProperty('venues')){
                    let venue = eventsSet[key]._embedded.venues[0];
                    if(venue){
                        if(venue.address)
                            currentEvent.address = venue.address;

                        if(venue.name){
                            if(!currentEvent.address) currentEvent.address = {};
                            currentEvent.address.name = venue.name;
                        }
                    }
                }

                // Remove this comment to get categories
                /*if(eventsSet[key]._embedded.hasOwnProperty('categories')){
                 currentEvent.categories = [];
                 let eventCategories = eventsSet[key]._embedded.categories;
                 currentEvent.categories = Object.keys(eventCategories).map(function(category){
                 return eventCategories[category].name
                 });
                 }*/

                currentEvent.img = this.getImageForEvent(eventsSet[key].images);

                tmpEventSet.push(currentEvent);

            }
        }
        return tmpEventSet;
    }

    makeRequest(handler, url=this.apiUrl, attrs={}, method="GET"){
        attrs = Object.keys(attrs).map(function(key){
            return `${key}=${attrs[key]}`;
        }).join("&");
        url = [url,attrs].join("?");
        if (this.widgetRoot.getAttribute('w-postalcodeapi') != null) url += '&postalCode=' + this.widgetRoot.getAttribute('w-postalcodeapi');
        url += '&sort=date,asc';
        this.xmlHTTP = window.XMLHttpRequest ? new XMLHttpRequest() : new ActiveXObject("Microsoft.XMLHTTP");
        if(method == "POST") {
            this.xmlHTTP.setRequestHeader("Content-type","application/x-www-form-urlencoded");
        }
        this.xmlHTTP.widget = this;
        this.xmlHTTP.onreadystatechange = handler;
        this.xmlHTTP.open(method, url, true);
        this.xmlHTTP.send();
    }

    initPretendedLink(el, url, isBlank){
        if(el && url){
            el.setAttribute('data-url', url);
            el.classList.add("event-pretended-link");
            el.addEventListener('click', function(){
                let url = this.getAttribute('data-url');
                if(url){
                    let win = window.open(url, (isBlank ? '_blank' : '_self'));
                    win.focus();
                }
            });
            el.addEventListener('touchstart', function(){
                let url = this.getAttribute('data-url');
                if(url){
                    let win = window.open(url, (isBlank ? '_blank' : '_self'));
                    win.focus();
                }
            });
        }
        return el;
    }

    createBackgroundImage(event, img) {
        if (!this.isListView) {
            var image = document.createElement("span");
            image.classList.add("bg-cover");
            image.style.backgroundImage = `url('${img}')`;
            event.appendChild(image);
        }
    }

    addBuyButton(domNode, url) {
        if (this.isListView) {
            let _urlValid = ( this.isUniversePluginInitialized && this.isUniverseUrl(url) ) || ( this.isTMPluginInitialized && this.isAllowedTMEvent(url) );
            if(!_urlValid) url = '';
            let buyBtn = document.createElement("a");
            buyBtn.appendChild(document.createTextNode('BUY NOW'));
            buyBtn.classList.add("event-buy-btn");
            buyBtn.target = '_blank';
            buyBtn.href = url;
            buyBtn.setAttribute('onclick', "ga('send', 'event', 'DiscoveryClickBuyButton', 'click');");
            domNode.appendChild(buyBtn);
        }
    }

    createDOMItem(itemConfig){
        var medWrapper = document.createElement("div");
        medWrapper.classList.add("event-content-wraper");

        var event = document.createElement("li");
        event.classList.add("event-wrapper");

        /* event.style.height = `${this.widgetContentHeight - this.borderSize * 2}px`;
        event.style.width  = `${this.config.width - this.borderSize * 2}px`;
        */

        event.style.height = `${this.widgetContentHeight}px`;
        event.style.width  = `${this.config.width}px`;

        this.createBackgroundImage(event, itemConfig.img);

        var nameContent = document.createTextNode(itemConfig.name),
            name =  document.createElement("span");
        name.classList.add("event-name");
        name.appendChild(nameContent);
        this.initPretendedLink(name, itemConfig.url, true);
        name.setAttribute('onclick', `ga('send', 'event', 'DiscoveryClickeventName_theme=${this.config.theme}_width=${this.config.width}_height=${this.config.height}_color_scheme=${this.config.colorscheme}', 'click', '${itemConfig.url}');`);
        /* name.setAttribute('onclick', "ga('send', 'event', 'DiscoveryClickeventName', 'click', '" + itemConfig.url + "');"); */
        medWrapper.appendChild(name);

        this.addBuyButton(medWrapper, itemConfig.url);

        var dateTimeContent = document.createTextNode(this.formatDate(itemConfig.date)),
            dateTime = document.createElement("span");
        dateTime.classList.add("event-date");
        dateTime.appendChild(dateTimeContent);

        var dateWraper = document.createElement("span");
        dateWraper.classList.add("event-date-wraper");
        dateWraper.appendChild(dateTime);
        medWrapper.appendChild(dateWraper);

        if(itemConfig.hasOwnProperty("address")){
            var addressWrapper = document.createElement("span");
            addressWrapper.classList.add("address-wrapper");

            if( itemConfig.address.hasOwnProperty("name") ){
                var addressNameText = document.createTextNode(itemConfig.address.name),
                    addressName =  document.createElement("span");
                addressName.classList.add("event-address");
                addressName.classList.add("event-address-name");
                addressName.appendChild(addressNameText);
                addressWrapper.appendChild(addressName);
            }

            if( itemConfig.address.hasOwnProperty("line1") ){
                var addressOneText = document.createTextNode(itemConfig.address.line1),
                    addressOne =  document.createElement("span");
                addressOne.classList.add("event-address");
                addressOne.appendChild(addressOneText);
                addressWrapper.appendChild(addressOne);
            }

            if( itemConfig.address.hasOwnProperty("line2") ){
                var addressTwoText = document.createTextNode(itemConfig.address.line2),
                    addressTwo =  document.createElement("span");
                addressTwo.classList.add("event-address");
                addressTwo.appendChild(addressTwoText);
                addressWrapper.appendChild(addressTwo);
            }

            medWrapper.appendChild(addressWrapper);
        }

        if(itemConfig.hasOwnProperty("categories")) {
            var categoriesWrapper = document.createElement("span");
            categoriesWrapper.classList.add("category-wrapper");

            itemConfig.categories.forEach(function (element) {
                var categoryText = document.createTextNode(element),
                    category = document.createElement("span");
                category.classList.add("event-category");
                category.appendChild(categoryText);
                categoriesWrapper.appendChild(category);
            });
            medWrapper.appendChild(categoriesWrapper);
        }

        event.appendChild(medWrapper);

        return event;
    }

    makeImageUrl(id){
        return `https://app.ticketmaster.com/discovery/v2/events/${id}/images.json`;
    }

    /* Config block */

    decConfig(config){
        return JSON.parse(window.atob(config));
    }

    encConfig(config){
        return window.btoa(config);
    }

    toShortISOString(dateObj){
        return dateObj.getFullYear() +
            "-" + (dateObj.getMonth() + 1 < 10 ? "0"+ (dateObj.getMonth()+ 1): dateObj.getMonth() + 1) +
            "-" + (dateObj.getDate() < 10 ? "0"+ dateObj.getDate(): dateObj.getDate()) +
            "T" + (dateObj.getHours() < 10 ? "0"+dateObj.getHours(): dateObj.getHours()) +
            ":" + (dateObj.getMinutes() < 10 ? "0"+dateObj.getMinutes(): dateObj.getMinutes()) +
            ":" + (dateObj.getSeconds() < 10 ? "0"+dateObj.getSeconds(): dateObj.getSeconds()) +
            "Z";
    }

    getDateFromPeriod(period){
        let firstDay = new Date();
        let lastDay = new Date();
        lastDay.setDate(lastDay.getDate() + 1);

        if (period != 'week') {
            period = new Date(document.querySelector('[w-type="calendar"]').getAttribute("w-period"));
            let firstDay = new Date(period);
            let lastDay = new Date(period);
            lastDay.setDate(lastDay.getDate() + 1);
            firstDay.setHours(0);   lastDay.setHours(23);
            firstDay.setMinutes(0); lastDay.setMinutes(59);
            firstDay.setSeconds(0); lastDay.setSeconds(59);
        }

        firstDay = new Date( new Date(new Date()).toISOString() );
        lastDay = new Date( new Date(new Date().valueOf()+24*60*60*1000).toISOString() );

        return [this.toShortISOString(firstDay), this.toShortISOString(lastDay)];
    }

}

class TabsControls {

    removeActiveTab(this_) {
        let tabs = this_.querySelectorAll('.tb');
        var tabsLenght = tabs.length;
        for (let i=0; i < tabsLenght; i++) {
            // Array.from(tabs).forEach(tab => {
            let tab = tabs[i];
            if (tab.classList.contains("active")) tab.classList.remove("active");
            // });
        }
        let tab = this_.nextSibling.querySelectorAll('.tab');
        var tabLenght = tab.length;
        for (let i=0; i < tabLenght; i++) {
            // Array.from(tab).forEach(tb => {
            let tb = tab[i];
            if (tb.classList.contains("active")) tb.classList.remove("active");
            // });
        }
    }

    selActiveTab(activeTab, this_) {
        let tabs = this_.nextSibling;
        tabs.children[activeTab].classList.add('active');
    }

    constructor() {
        let self = this;
        var tabs = document.querySelectorAll('.tb');
        var tabsList = document.getElementsByClassName('tabs');
        var tabsLenght = tabs.length;
        for (let i=0; i < tabsLenght; i++) {
            // Array.from(tabs).forEach(tab => {
            let tab = tabs[i];
            tab.addEventListener('click', function (e) {
                let this_ = e.target.parentNode;
                self.removeActiveTab(this_);
                let index = Array.prototype.indexOf.call(this_.children, e.target);
                this.classList.add("active");
                self.selActiveTab(index, this_);
            });
         }
         // });
    }
}

class SelectorControls {

    constructor(root, selectorClass, selectorContent, attribute, update) {
        if (!root) return;
        this.SelectorRoot = root;
        this.SelectorClass = selectorClass;
        this.SelectorContent = selectorContent;
        this.SelectorContainer = document.createElement("div");
        this.SelectorContainer.classList.add(this.SelectorClass);
        this.SelectorContainer.innerHTML = this.SelectorContent;
        this.SelectorRoot.appendChild(this.SelectorContainer);

        this.selTitle = this.SelectorContainer.getElementsByTagName("span")[0];
        this.selContent = this.selTitle.nextElementSibling;

        this.selContent.addEventListener("click",function(e){
            if (e.target.classList.contains('selector-content') === false) {
                this.parentNode.getElementsByClassName('selector-title')[0].innerHTML = e.target.innerHTML;
                this.parentNode.getElementsByClassName('selector-title')[0].setAttribute("w-classificationid", e.target.getAttribute('w-classificationId'));
                this.parentNode.getElementsByClassName('selector-title')[0].classList.remove('open');
                this.parentNode.getElementsByClassName('selector-content')[0].classList.remove('show');
                if (attribute == 'period') this.parentNode.parentNode.parentNode.parentNode.setAttribute('w-period', e.target.getAttribute('w-period'));
                if (attribute == 'w-period') this.parentNode.parentNode.parentNode.parentNode.setAttribute('w-period-week', e.target.getAttribute('w-period-week'));
                if (attribute == 'classificationId') this.parentNode.parentNode.parentNode.parentNode.setAttribute('w-classificationId', e.target.getAttribute('w-classificationId'));

                /* Month fix by dates changing */
                if (this.parentNode.classList.contains('sliderLeftSelector') === true) {
                    if (this.parentNode.nextElementSibling.querySelector('.selector-title').getAttribute('w-classificationid') != undefined) {
                        if (this.parentNode.nextElementSibling.querySelector('.selector-title').getAttribute('w-classificationid') != this.parentNode.parentNode.parentNode.parentNode.getAttribute("w-classificationId")) {
                            this.parentNode.parentNode.parentNode.parentNode.setAttribute("w-classificationId", this.parentNode.nextElementSibling.querySelector('.selector-title').getAttribute('w-classificationid'));
                        }
                    }
                }

                update();
            }
            else {
                console.log(this.classList);
                if (this.classList.contains("show")) {
                    this.classList.remove("show");
                    this.prevElementSibling.classList.remove("open");
                }
            }
        });

        this.selTitle.addEventListener("click",function(e){
            this.nextElementSibling.classList.add("show");
            if ( this.classList.contains("open") ) {
                this.classList.remove("open");
                this.nextElementSibling.classList.remove("show");
            }
            else {
                this.classList.add("open");
            }
            this.nextElementSibling.focus();
        },false);

        this.selContent.addEventListener("blur",function(e){
            var self = this;
            if (self.classList.contains("show")) {
                setTimeout(function () {
                    self.classList.remove("show");
                    self.previousElementSibling.classList.remove("open");
                }, 127);
            }
        },false);

    }

}

class WeekScheduler {

    get apiUrl(){ return "https://app.ticketmaster.com/discovery/v2/events.json"; }

    get eventReqAttrs(){
        let calendarWidgetRoot = this.eventsRootContainer.parentNode.parentNode.parentNode;
        let tmapikey = '',
            keyword = '',
            radius;

        let attrs = {},
            params = [
                {
                    attr: 'tmapikey',
                    verboseName: 'apikey'
                },
                {
                    attr: 'latlong',
                    verboseName: 'latlong'
                },
                {
                    attr: 'keyword',
                    verboseName: 'keyword'
                },
                {
                    attr: 'size',
                    verboseName: 'size'
                },
                {
                    attr: 'radius',
                    verboseName: 'radius'
                },
                {
                    attr: 'classificationid',
                    verboseName: 'classificationId'
                },
                {
                    attr: 'attractionid',
                    verboseName: 'attractionId'
                },
                {
                    attr: 'promoterid',
                    verboseName: 'promoterId'
                },
                {
                    attr: 'venueid',
                    verboseName: 'venueId'
                },
                {
                    attr: 'city',
                    verboseName: 'city'
                },
                {
                    attr: 'countrycode',
                    verboseName: 'countryCode'
                },
                {
                    attr: 'segmentid',
                    verboseName: 'segmentId'
                }
            ];

        let startmonth, startdate, endmonth, enddate;
        let classificationid = '';
        let countrycode = '';
        let city = '';
        let startDateTime = '2016-06-27T00:00:00Z';
        let endDateTime = '2016-07-02T23:59:59Z';
        let latlong = '';

        let current = new Date();
        let start = new Date();
        let end = new Date();

        let weekstart = current.getDate() - current.getDay();
        start = new Date(current.setDate(weekstart));
        end.setDate(start.getDate() + 7);
        if (start.getMonth()+1 <=9) startmonth = '0' + (start.getMonth()+1); else startmonth = start.getMonth()+1;
        if (start.getDate() <=9) startdate = '0' + start.getDate(); else startdate = start.getDate();
        if (end.getMonth()+1 <=9) endmonth = '0' + (end.getMonth()+1); else endmonth = end.getMonth()+1;
        if (end.getDate() <=9) enddate = '0' + end.getDate(); else enddate = end.getDate();
        startDateTime = start.getFullYear() + '-' + startmonth + '-' + startdate + 'T00:00:00Z';
        endDateTime = end.getFullYear() + '-' + endmonth + '-' + enddate + 'T23:59:59Z';

        if (calendarWidgetRoot.getAttribute("w-period-week") != 'week') {
            start = new Date(calendarWidgetRoot.getAttribute("w-period-week"));
            end = new Date(calendarWidgetRoot.getAttribute("w-period-week"));
            end.setDate(end.getDate() + 7);
            if (start.getMonth()+1 <=9) startmonth = '0' + (start.getMonth()+1); else startmonth = start.getMonth()+1;
            if (start.getDate() <=9) startdate = '0' + start.getDate(); else startdate = start.getDate();
            if (end.getMonth()+1 <=9) endmonth = '0' + (end.getMonth()+1); else endmonth = end.getMonth()+1;
            if (end.getDate() <=9) enddate = '0' + end.getDate(); else enddate = end.getDate();
            startDateTime = start.getFullYear() + '-' + startmonth + '-' + startdate + 'T00:00:00Z';
            endDateTime = end.getFullYear() + '-' + endmonth + '-' + enddate + 'T23:59:59Z';
        }

        if (calendarWidgetRoot.getAttribute("w-tmapikey") != '') {
            tmapikey = calendarWidgetRoot.getAttribute("w-tmapikey");
            /* if (sessionStorage.getItem('tk-api-key')) {
                tmapikey = sessionStorage.getItem('tk-api-key');
                document.querySelector('[w-type="calendar"]').setAttribute("w-tmapikey", tmapikey);
            }
            */
        }

        if (calendarWidgetRoot.getAttribute("w-latlong") != '') {
            latlong = calendarWidgetRoot.getAttribute("w-latlong");
        }

        // if (latlong === null) latlong = '34.0390107,-118.2672801';

        if (calendarWidgetRoot.getAttribute("w-keyword") != '') {
            keyword = calendarWidgetRoot.getAttribute("w-keyword");
        }

        if (calendarWidgetRoot.getAttribute("w-radius") != '') {
            radius = calendarWidgetRoot.getAttribute("w-radius");
        }

        if (calendarWidgetRoot.getAttribute("w-classificationId") != '') {
            classificationid = calendarWidgetRoot.getAttribute("w-classificationId");
        }

        if (calendarWidgetRoot.getAttribute("w-countrycode") != null) {
            countrycode = calendarWidgetRoot.getAttribute("w-countrycode");
            latlong = '';
        }

        if (calendarWidgetRoot.getAttribute("w-city") != null) {
            city = calendarWidgetRoot.getAttribute("w-city");
            latlong = '';
        }

        if (new Date(startDateTime).getFullYear() == '1969' || new Date(startDateTime).getFullYear() == '1970') {
            current = new Date();
            start = new Date();
            end = new Date();

            weekstart = current.getDate() - current.getDay();
            start = new Date(current.setDate(weekstart));
            end.setDate(start.getDate() + 7);
            if (start.getMonth()+1 <=9) startmonth = '0' + (start.getMonth()+1); else startmonth = start.getMonth()+1;
            if (start.getDate() <=9) startdate = '0' + start.getDate(); else startdate = start.getDate();
            if (end.getMonth()+1 <=9) endmonth = '0' + (end.getMonth()+1); else endmonth = end.getMonth()+1;
            if (end.getDate() <=9) enddate = '0' + end.getDate(); else enddate = end.getDate();
            startDateTime = start.getFullYear() + '-' + startmonth + '-' + startdate + 'T00:00:00Z';
            endDateTime = end.getFullYear() + '-' + endmonth + '-' + enddate + 'T23:59:59Z';
        }

        return {
            "apikey": tmapikey,
            "latlong": latlong,
            "keyword": keyword,
            "countryCode": countrycode,
            "city": city,
            "startDateTime": startDateTime,
            "endDateTime": endDateTime,
            "classificationId": classificationid,
            "radius": radius,
            "size": "500"
        }

    }

    get messageRootContainer(){ return 'weekSсheduler'; }

    get hideMessageDelay(){ return 3000; }

    addScroll() {
        (function(n,t){function u(n){n.hasOwnProperty("data-simple-scrollbar")||Object.defineProperty(n,"data-simple-scrollbar",new SimpleScrollbar(n))}function e(n,i){function f(n){var t=n.pageY-u;u=n.pageY;r(function(){i.el.scrollTop+=t/i.scrollRatio})}function e(){n.classList.remove("ss-grabbed");t.body.classList.remove("ss-grabbed");t.removeEventListener("mousemove",f);t.removeEventListener("mouseup",e)}var u;n.addEventListener("mousedown",function(i){return u=i.pageY,n.classList.add("ss-grabbed"),t.body.classList.add("ss-grabbed"),t.addEventListener("mousemove",f),t.addEventListener("mouseup",e),!1})}function i(n){for(this.target=n,this.bar='<div class="ss-scroll">',this.wrapper=t.createElement("div"),this.wrapper.setAttribute("class","ss-wrapper"),this.el=t.createElement("div"),this.el.setAttribute("class","ss-content"),this.wrapper.appendChild(this.el);this.target.firstChild;)this.el.appendChild(this.target.firstChild);this.target.appendChild(this.wrapper);this.target.insertAdjacentHTML("beforeend",this.bar);this.bar=this.target.lastChild;e(this.bar,this);this.moveBar();this.el.addEventListener("scroll",this.moveBar.bind(this));this.el.addEventListener("mouseenter",this.moveBar.bind(this));this.target.classList.add("ss-container")}function f(){for(var i=t.querySelectorAll("*[ss-container]"),n=0;n<i.length;n++)u(i[n])}var r=n.requestAnimationFrame||n.setImmediate||function(n){return setTimeout(n,0)};i.prototype={moveBar:function(){var t=this.el.scrollHeight,i=this.el.clientHeight,n=this;this.scrollRatio=i/t;r(function(){n.bar.style.cssText="height:"+i/t*100+"%; top:"+n.el.scrollTop/t*100+"%;right:-"+(n.target.clientWidth-n.bar.clientWidth)+"px;"})}};t.addEventListener("DOMContentLoaded",f);i.initEl=u;i.initAll=f;n.SimpleScrollbar=i})(window,document)
        var scrollRoot = document.querySelectorAll(".ss");
        var maxL = scrollRoot.length;
        for (let ml = 0; ml < maxL; ml++) {
            SimpleScrollbar.initEl(scrollRoot[ml]);
        }
    }

    initMessage(schedulerRoot){
        this.eventsRootContainer = schedulerRoot;
        this.messageDialogContainer = document.createElement('div');
        this.messageDialogContainer.classList.add("event-message-container");
        this.messageDialog = document.createElement('div');
        this.messageDialog.classList.add("event-message_");
        this.messageContent = document.createElement('div');
        this.messageContent.classList.add("event-message__content");

        let messageClose = document.createElement('div');
        messageClose.classList.add("event-message__btn");
        messageClose.addEventListener("click", ()=> {
            this.hideMessage();
        });

        this.messageDialog.appendChild(this.messageContent);
        this.messageDialog.appendChild(messageClose);
        this.messageDialogContainer.appendChild(this.messageDialog);
        this.eventsRootContainer.appendChild(this.messageDialogContainer);
    }

    showMessage(message, hideMessageWithoutDelay){

        if(message.length){
            this.hideMessageWithoutDelay = hideMessageWithoutDelay;
            this.messageContent.innerHTML = message;
            this.messageDialog.classList.add("event-message_-visible");
            if (this.messageTimeout) {
                clearTimeout(this.messageTimeout); // Clear timeout if before 'hideMessageWithDelay' was called
            }
        }
    }

    hideMessageWithDelay(delay){
        if(this.messageTimeout) clearTimeout(this.messageTimeout); // Clear timeout if this method was called before
        this.messageTimeout = setTimeout(()=>{
            this.hideMessage();
        }, delay);
    }

    hideMessage(){
        if(this.messageTimeout) clearTimeout(this.messageTimeout); // Clear timeout and hide message immediately.
        this.messageDialog.classList.remove("event-message_-visible");
    }

    getJSON(handler, url=this.apiUrl, attrs={}, method="GET"){
        attrs = Object.keys(attrs).map(function(key){
            return `${key}=${attrs[key]}`;
        }).join("&");

        url = [url,attrs].join("?");
        let thisSchedulerRoot = this.weekSchedulerRoot.parentNode.parentNode.parentNode;
        if (thisSchedulerRoot.getAttribute('w-postalcodeapi') != null) url += '&postalCode=' + thisSchedulerRoot.getAttribute('w-postalcodeapi');
        url += '&sort=date,asc';

        this.xmlHTTP = window.XMLHttpRequest ? new XMLHttpRequest() : new ActiveXObject("Microsoft.XMLHTTP");
        if(method == "POST") {
            this.xmlHTTP.setRequestHeader("Content-type","application/x-www-form-urlencoded");
        }
        this.xmlHTTP.widget = this;
        this.xmlHTTP.onreadystatechange = handler;
        this.xmlHTTP.open(method, url, true);
        this.xmlHTTP.send();
    }

    getJsonAsync(url) {
        return new Promise(function (resolve, reject) {
            var xhr = new XMLHttpRequest();
            xhr.open('GET', url);

            xhr.onload = () => {
                if (xhr.status === 200) {
                    var result = JSON.parse(xhr.response);
                    resolve(result);
                } else {
                    reject("Error loading JSON!");
                }
            }
            xhr.onerror = () => {
                reject("Error loading JSON!");
            };
            xhr.send();
        });
    }

    formatDate(date) {
        var result = '';
        if(!date.day) return result; // Day is required

        function LZ(x) {
            return (x < 0 || x > 9 ? "" : "0") + x
        }
        var MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'],
            DAY_NAMES = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'],
            dayArray = date.day.split('-'),
            d = parseInt(dayArray[2]),
            M = parseInt(dayArray[1]);

        // var E = new Date(date.day).getDay();
        var E = new Date(+date.day.split('-')[0],(+date.day.split('-')[1])-1,+date.day.split('-')[2]).getDay();
        result = DAY_NAMES[E] + ', ' + MONTH_NAMES[M - 1] + ' ' + d + ', ' + dayArray[0];

        if(!date.time) return result;

        var timeArray = date.time.split(':'),
            H = parseInt(timeArray[0]),
            m = timeArray[1],
            a = "AM";

        if (H > 11) a = "PM";
        if (H == 0) {
            H = 12;
        } else if (H > 12) {
            H = H - 12;
        }

        return result + ' ' + LZ(H) + ':' + m + ' ' + a;
    }

    getWeekEventsHandler() {
        let events;
        let place;
        let address;
        let weekEvents = [];
        let widget = this.widget;
        let schedulerRoot = widget.weekSchedulerRoot;
        let calendarWidgetRoot = this.widget.eventsRootContainer.parentNode.parentNode.parentNode;
        let spinner = schedulerRoot.querySelector('.spinner-container');
        let prm = [];
        let messageContainer = schedulerRoot.querySelector('.event-message-container');

        if (this && this.readyState == XMLHttpRequest.DONE) {

            if (this.status == 200) {

                events = JSON.parse(this.responseText);

                if (events.page.totalPages <= 1) {
                    spinner.classList.add('hide');
                    if (events.page.totalElements != 0) {
                        events._embedded.events.forEach(function (item) {
                            if (item.hasOwnProperty('_embedded') && item._embedded.hasOwnProperty('venues')) {
                                if (item._embedded.venues[0].hasOwnProperty('name')) {
                                    place = item._embedded.venues[0].name + ', ';
                                }
                                else {
                                    place = '';
                                }
                                if (item._embedded.venues[0].hasOwnProperty('address')) {
                                    address = item._embedded.venues[0].address.line1;
                                } else {
                                    address = '';
                                }
                            }
                            else {
                                place = '';
                                address = '';
                            }

                            let imgWidth;
                            let index;
                            item.images.forEach(function (img, i) {
                                if (i == 0) imgWidth = img.width;
                                if (imgWidth > img.width) {
                                    imgWidth = img.width;
                                    index = i;
                                }
                            });

                            if (item.hasOwnProperty('dates') && item.dates.hasOwnProperty('start') && item.dates.start.hasOwnProperty('localTime')) {
                                if (+new Date( +new Date().getFullYear(), +new Date().getMonth(), +new Date().getDate()) <= +new Date(+item.dates.start.localDate.split('-')[0],(+item.dates.start.localDate.split('-')[1])-1,+item.dates.start.localDate.split('-')[2])) {
                                    weekEvents.push({
                                        'name': item.name,
                                        'date': item.dates.start.localDate,
                                        'time': item.dates.start.localTime,
                                        'datetime': widget.formatDate({
                                            day: item.dates.start.localDate,
                                            time: item.dates.start.localTime
                                        }),
                                        'place': place + address,
                                        'url': item.url,
                                        'img': (item.hasOwnProperty('images') && item.images[index] != undefined) ? item.images[index].url : '',
                                        'count': 0
                                    });
                                }
                            }
                        });
                    }
                    else {
                        weekEvents[0] = ({
                            date: '',
                            time: '',
                        });
                        messageContainer.classList.remove('hide');
                        widget.showMessage("No results were found.<br/>Here other options for you.");
                        widget.hideMessageWithDelay(widget.hideMessageDelay);
                    }

                    if (weekEvents[0] === undefined) {
                        weekEvents[0] = ({
                            date: '',
                            time: '',
                        });
                        messageContainer.classList.remove('hide');
                        widget.showMessage("No results were found.<br/>Here other options for you.");
                        widget.hideMessageWithDelay(widget.hideMessageDelay);
                    }

                    let tDate = weekEvents[0].date;
                    let tTime = weekEvents[0].time.substr(0,2);
                    let count = 0;
                    let startFlag = 0;
                    let endFlag = 0;

                    for (let e = 0, l = weekEvents.length; e < l; ++e) {
                        if (tDate == weekEvents[e].date && tTime == weekEvents[e].time.substr(0,2)) {
                            weekEvents[e].count = count;
                            endFlag = e;
                            count++;
                        }
                        if (tDate == weekEvents[e].date && tTime != weekEvents[e].time.substr(0,2)) {
                            for (let i = startFlag; i <= endFlag; i++) {
                                weekEvents[i].count = count-1;
                            }
                            tTime = weekEvents[e].time.substr(0,2);
                            startFlag = e;
                            count = 0;
                        }
                        if (tDate != weekEvents[e].date || e == l-1) {
                            for (let i = startFlag; i <= endFlag; i++) {
                                weekEvents[i].count = count-1;
                            }
                            tDate = weekEvents[e].date;
                            tTime = weekEvents[e].time.substr(0,2);
                            startFlag = e;
                            count = 0;
                        }
                    }

                    var current = new Date();

                    if (calendarWidgetRoot.getAttribute("w-period-week") != 'week') {
                        var weekstart = new Date(calendarWidgetRoot.getAttribute("w-period-week"));
                        weekstart.setDate(weekstart.getDate() - weekstart.getDay());
                    }
                    else {
                        var weekstart = current.getDate() - current.getDay();
                        weekstart = new Date(current.setDate(weekstart));
                    }

                    if (weekstart.getFullYear() == '1969') {
                        current = new Date();
                        weekstart = current.getDate() - current.getDay();
                        weekstart = new Date(current.setDate(weekstart));
                    }

                    let currentSunday = weekstart;
                    let daysDiv = '';
                    let currentDayClass = '';
                    let dayOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
                    let now = new Date();
                    for (let i = 0; i <= 6; i++) {
                        let day = new Date(new Date(currentSunday).getTime() + (i * 24 * 60 * 60 * 1000));
                        if (day.getDay() == now.getDay() && day.getDate() == now.getDate()) currentDayClass = ' active'; else currentDayClass = '';
                        daysDiv += `<span class="d${currentDayClass}">${dayOfWeek[i]} <span class="num">${day.getDate()}</span></span>`;
                    }
                    let zeroLead = '';
                    let timeTmp = '';
                    let dateTmp = '';
                    let monthTmp = '';
                    let timeDiv = '<div class="ss time-wrapper"><div class="ss-container time-holder">';

                    for (let i = 13; i <= 23; i++) {
                        if (i <= 9) {
                            zeroLead = '0';
                            timeTmp = '0' + i + ":00:00";
                        } else {
                            zeroLead = '';
                            timeTmp = i + ":00:00"
                        }
                        timeDiv += `<div class="t t-${i}"><span class="tl">${zeroLead}${i} : 00</span>`;

                        var dayTmp = new Date(currentSunday);

                        for (let d = 0; d <= 6; d++) {
                            let dayCount = 0;
                            if (d!=0) dayTmp.setDate(dayTmp.getDate() + 1);
                            if (parseInt(dayTmp.getMonth() + 1) <= 9) monthTmp = '0' + parseInt(dayTmp.getMonth() + 1); else monthTmp = dayTmp.getMonth() + 1;
                            if (parseInt(dayTmp.getDate()) <= 9) {
                                dateTmp = dayTmp.getFullYear() + '-' + monthTmp + '-' + '0' + parseInt(dayTmp.getDate());
                            }
                            else {
                                dateTmp = dayTmp.getFullYear() + '-' + monthTmp + '-' + dayTmp.getDate();
                            }
                            timeDiv += `<div class="d d-${d}" w-date="${dateTmp}" w-time="${zeroLead}${i}:00:00">`;

                            for (let e = 0, l = weekEvents.length; e < l; ++e) {
                                if (weekEvents[e].date == dateTmp && weekEvents[e].time.substr(0,2) == timeTmp.substr(0,2)) {
                                    if (dayCount == 0) {
                                        timeDiv += '<span class="round"></span>';
                                        if (weekEvents[e].time.substring(0,2) < 18) {
                                            timeDiv += '<span class="tail"></span>';
                                            timeDiv += '<div class="popup ';
                                            if (weekEvents[e].count == 0) timeDiv += 'single ';
                                            timeDiv += 'ss" tabindex="-1">';
                                            timeDiv += '<div class="ss-container">';
                                        }
                                        else {
                                            timeDiv += '<span class="tail-up"></span>';
                                            timeDiv += '<div class="popup-up ';
                                            if (weekEvents[e].count == 0) timeDiv += 'single ';
                                            timeDiv +=  'ss" tabindex="-1">';
                                            timeDiv += '<div class="ss-container">';
                                        }
                                        dayCount = 1;
                                    }
                                    timeDiv += '<span class="event">';
                                    timeDiv += '<span class="event-holder">';
                                    timeDiv += '<a href="' + weekEvents[e].url + '" target="_blank">';
                                    if (weekEvents[e].img !=='' && weekEvents[e].img.length !== 0){
                                        timeDiv += '<span class="img bg-cover-default" style="background: url(' + weekEvents[e].img + ') center center no-repeat"></span>'
                                    }else{ timeDiv += '<span class="img bg-cover-default" ></span>';}
                                    timeDiv += '<span class="name">' + weekEvents[e].name + '</span>';
                                    timeDiv += '</a>';
                                    timeDiv += '<span class="date">' + weekEvents[e].datetime + '</span>';
                                    timeDiv += '<span class="place">' + weekEvents[e].place + '</span>';
                                    timeDiv += '</span>';
                                    timeDiv += '</span>';
                                }
                            }
                            if (dayCount == 1) timeDiv += '</div></div>';
                            timeDiv += '</div>';
                        }
                        timeDiv += `</div>`;
                    }
                    timeDiv += `</div></div>`;
                    daysDiv += timeDiv;
                    widget.weekdaysRootContainer.innerHTML = daysDiv;
                    widget.addScroll();
                    var rounds = widget.weekdaysRootContainer.querySelectorAll("span.round");
                    for (var x = 0; x < rounds.length; x++) {
                        rounds[x].addEventListener("click", function (e) {
                            widget.weekdaysRootContainer.querySelectorAll(".ss-wrapper")[0].style.overflow = "visible";
                            widget.weekdaysRootContainer.querySelectorAll(".ss-content")[0].style.overflow = "visible";
                            this.nextElementSibling.classList.add("show");
                            this.nextElementSibling.nextElementSibling.classList.add("show");
                            this.nextElementSibling.nextElementSibling.focus();
                        }, false);
                    }

                    var popups = widget.weekdaysRootContainer.querySelectorAll(".popup, .popup-up");
                    for (var y = 0; y < popups.length; y++) {
                        popups[y].addEventListener("blur", function (e) {
                            let self = this;
                            widget.weekdaysRootContainer.querySelectorAll(".ss-wrapper")[0].style.overflow = "hidden";
                            widget.weekdaysRootContainer.querySelectorAll(".ss-content")[0].style.overflow = "auto";
                            setTimeout(function () {
                                self.previousElementSibling.classList.remove("show");
                                self.classList.remove("show");
                            }, 127);
                        }, false);
                    }
                }
                else {
                    weekEvents = [];
                    let weekEventsConcat = [];
                    let l = events.page.totalPages - 1;
                    for (let i = 0; i <= l; i++) {
                        let attrs = widget.eventReqAttrs;
                        attrs.page = i;
                        attrs = Object.keys(attrs).map(function (key) {
                            return `${key}=${attrs[key]}`;
                        }).join("&");
                        let url;
                        url = widget.apiUrl + [url, attrs].join("?");
                        let thisSchedulerRoot = widget.weekSchedulerRoot.parentNode.parentNode.parentNode;
                        if (thisSchedulerRoot.getAttribute('w-postalcodeapi') != null) url += '&postalCode=' + thisSchedulerRoot.getAttribute('w-postalcodeapi');
                        url += '&sort=date,asc';
                        prm.push(widget.getJsonAsync(url));
                    }
                    Promise.all(prm).then(value => {
                        spinner.classList.add('hide');
                        let le = value.length;
                        for (let e = 0; e <= le; e++) {
                            if(value[e] && value[e]._embedded && value[e]._embedded.events){
                                value[e]._embedded.events.forEach(function (item) {
                                    if (item.hasOwnProperty('_embedded') && item._embedded.hasOwnProperty('venues')) {
                                        if (item._embedded.venues[0].hasOwnProperty('name')) {
                                            place = item._embedded.venues[0].name + ', ';
                                        }
                                        else {
                                            place = '';
                                        }
                                        if (item._embedded.venues[0].hasOwnProperty('address')) {
                                            address = item._embedded.venues[0].address.line1;
                                        } else {
                                            address = '';
                                        }
                                    }
                                    else {
                                        place = '';
                                        address = '';
                                    }

                                    let imgWidth;
                                    let index;
                                    item.images.forEach(function (img, i) {
                                        if (i == 0) imgWidth = img.width;
                                        if (imgWidth > img.width) {
                                            imgWidth = img.width;
                                            index = i;
                                        }
                                    });

                                    if (item.hasOwnProperty('dates') && item.dates.hasOwnProperty('start') && item.dates.start.hasOwnProperty('localTime')) {
                                        if (+new Date( +new Date().getFullYear(), +new Date().getMonth(), +new Date().getDate()) <= +new Date(+item.dates.start.localDate.split('-')[0],(+item.dates.start.localDate.split('-')[1])-1,+item.dates.start.localDate.split('-')[2])) {
                                            weekEvents.push({
                                                'name': item.name,
                                                'date': item.dates.start.localDate,
                                                'time': item.dates.start.localTime,
                                                'datetime': widget.formatDate({
                                                    day: item.dates.start.localDate,
                                                    time: item.dates.start.localTime
                                                }),
                                                'place': place + address,
                                                'url': item.url,
                                                'img': (item.hasOwnProperty('images') && item.images[index] != undefined) ? item.images[index].url : '',
                                            });
                                        }
                                    }
                                });
                            }
                            else {
                                weekEvents[0] = ({
                                    date: '',
                                    time: '',
                                });
                            }
                        }

                        weekEventsConcat.push(weekEvents);
                        weekEvents = weekEventsConcat[0];

                        if (weekEvents.length == 0) {
                            messageContainer.classList.remove('hide');
                            widget.showMessage("No results were found.<br/>Here other options for you.");
                            widget.hideMessageWithDelay(widget.hideMessageDelay);
                        }

                        let tDate = weekEvents[0].date;
                        let tTime = weekEvents[0].time.substr(0, 2);
                        let count = 0;
                        let startFlag = 0;
                        let endFlag = 0;

                        for (let e = 0, l = weekEvents.length; e < l; ++e) {
                            if (tDate == weekEvents[e].date && tTime == weekEvents[e].time.substr(0, 2)) {
                                weekEvents[e].count = count;
                                endFlag = e;
                                count++;
                            }
                            if (tDate == weekEvents[e].date && tTime != weekEvents[e].time.substr(0, 2)) {
                                for (let i = startFlag; i <= endFlag; i++) {
                                    weekEvents[i].count = count - 1;
                                }
                                tTime = weekEvents[e].time.substr(0, 2);
                                startFlag = e;
                                count = 0;
                            }
                            if (tDate != weekEvents[e].date || e == l - 1) {
                                for (let i = startFlag; i <= endFlag; i++) {
                                    weekEvents[i].count = count - 1;
                                }
                                tDate = weekEvents[e].date;
                                tTime = weekEvents[e].time.substr(0, 2);
                                startFlag = e;
                                count = 0;
                            }
                        }

                        var current = new Date();

                        if (calendarWidgetRoot.getAttribute("w-period-week") != 'week') {
                            var weekstart = new Date(calendarWidgetRoot.getAttribute("w-period-week"));
                            weekstart.setDate(weekstart.getDate() - weekstart.getDay());
                        }
                        else {
                            var weekstart = current.getDate() - current.getDay();
                            weekstart = new Date(current.setDate(weekstart));
                        }

                        if (weekstart.getFullYear() == '1969') {
                            current = new Date();
                            weekstart = current.getDate() - current.getDay();
                            weekstart = new Date(current.setDate(weekstart));
                        }

                        let currentSunday = weekstart;
                        let daysDiv = '';
                        let currentDayClass = '';
                        let dayOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
                        let now = new Date();
                        for (let i = 0; i <= 6; i++) {
                            let day = new Date(new Date(currentSunday).getTime() + (i * 24 * 60 * 60 * 1000));
                            if (day.getDay() == now.getDay() && day.getDate() == now.getDate()) currentDayClass = ' active'; else currentDayClass = '';
                            daysDiv += `<span class="d${currentDayClass}">${dayOfWeek[i]} <span class="num">${day.getDate()}</span></span>`;
                        }
                        let zeroLead = '';
                        let timeTmp = '';
                        let dateTmp = '';
                        let monthTmp = '';
                        let timeDiv = '<div class="ss time-wrapper"><div class="ss-container time-holder">';

                        for (let i = 13; i <= 23; i++) {
                            if (i <= 9) {
                                zeroLead = '0';
                                timeTmp = '0' + i + ":00:00";
                            } else {
                                zeroLead = '';
                                timeTmp = i + ":00:00"
                            }
                            timeDiv += `<div class="t t-${i}"><span class="tl">${zeroLead}${i} : 00</span>`;

                            var dayTmp = new Date(currentSunday);

                            for (let d = 0; d <= 6; d++) {
                                let dayCount = 0;
                                if (d != 0) dayTmp.setDate(dayTmp.getDate() + 1);
                                if (parseInt(dayTmp.getMonth() + 1) <= 9) monthTmp = '0' + parseInt(dayTmp.getMonth() + 1); else monthTmp = dayTmp.getMonth() + 1;
                                if (parseInt(dayTmp.getDate()) <= 9) {
                                    dateTmp = dayTmp.getFullYear() + '-' + monthTmp + '-' + '0' + parseInt(dayTmp.getDate());
                                }
                                else {
                                    dateTmp = dayTmp.getFullYear() + '-' + monthTmp + '-' + dayTmp.getDate();
                                }
                                timeDiv += `<div class="d d-${d}" w-date="${dateTmp}" w-time="${zeroLead}${i}:00:00">`;

                                for (let e = 0, l = weekEvents.length; e < l; ++e) {
                                    if (weekEvents[e].date == dateTmp && weekEvents[e].time.substr(0, 2) == timeTmp.substr(0, 2)) {
                                        if (dayCount == 0) {
                                            timeDiv += '<span class="round"></span>';
                                            if (weekEvents[e].time.substring(0, 2) < 18) {
                                                timeDiv += '<span class="tail"></span>';
                                                timeDiv += '<div class="popup ';
                                                if (weekEvents[e].count == 0) timeDiv += 'single ';
                                                timeDiv += 'ss" tabindex="-1">';
                                                timeDiv += '<div class="ss-container">';
                                            }
                                            else {
                                                timeDiv += '<span class="tail-up"></span>';
                                                timeDiv += '<div class="popup-up ';
                                                if (weekEvents[e].count == 0) timeDiv += 'single ';
                                                timeDiv += 'ss" tabindex="-1">';
                                                timeDiv += '<div class="ss-container">';
                                            }
                                            dayCount = 1;
                                        }
                                        timeDiv += '<span class="event">';
                                        timeDiv += '<span class="event-holder">';
                                        timeDiv += '<a href="' + weekEvents[e].url + '" target="_blank">';
                                        if (weekEvents[e].img !=='' && weekEvents[e].img.length !== 0){
                                            timeDiv += '<span class="img bg-cover-default" style="background: url(' + weekEvents[e].img + ') center center no-repeat"></span>'
                                        }else{ timeDiv += '<span class="img bg-cover-default" ></span>';}
                                        timeDiv += '<span class="name">' + weekEvents[e].name + '</span>';
                                        timeDiv += '</a>';
                                        timeDiv += '<span class="date">' + weekEvents[e].datetime + '</span>';
                                        timeDiv += '<span class="place">' + weekEvents[e].place + '</span>';
                                        timeDiv += '</span>';
                                        timeDiv += '</span>';
                                    }
                                }
                                if (dayCount == 1) timeDiv += '</div></div>';
                                timeDiv += '</div>';
                            }
                            timeDiv += `</div>`;
                        }
                        timeDiv += `</div></div>`;
                        daysDiv += timeDiv;
                        widget.weekdaysRootContainer.innerHTML = daysDiv;
                        widget.addScroll();

                        var rounds = widget.weekdaysRootContainer.querySelectorAll("span.round");
                        for (var x = 0; x < rounds.length; x++) {
                            rounds[x].addEventListener("click", function (e) {
                                widget.weekdaysRootContainer.querySelectorAll(".ss-wrapper")[0].style.overflow = "visible";
                                widget.weekdaysRootContainer.querySelectorAll(".ss-content")[0].style.overflow = "visible";
                                this.nextElementSibling.classList.add("show");
                                this.nextElementSibling.nextElementSibling.classList.add("show");
                                this.nextElementSibling.nextElementSibling.focus();
                            }, false);
                        }

                        var popups = widget.weekdaysRootContainer.querySelectorAll(".popup, .popup-up");
                        for (var y = 0; y < popups.length; y++) {
                            popups[y].addEventListener("blur", function (e) {
                                let self = this;
                                widget.weekdaysRootContainer.querySelectorAll(".ss-wrapper")[0].style.overflow = "hidden";
                                widget.weekdaysRootContainer.querySelectorAll(".ss-content")[0].style.overflow = "auto";
                                setTimeout(function () {
                                    self.previousElementSibling.classList.remove("show");
                                    self.classList.remove("show");
                                }, 127);
                            }, false);
                        }
                    }, reason => {
                        console.log(reason)
                    });
                }

            }
            else if (this.status == 400) {
                console.log('There was an error 400');
            }
            else {
                console.log('something else other than 200 was returned');
            }
        }

    }

    update() {
        let schedulerRoot = this.eventsRootContainer;
        let days = schedulerRoot.querySelector('.days');
        schedulerRoot.removeChild(days);
        this.weekdaysRootContainer = document.createElement("div");
        this.weekdaysRootContainer.classList.add("days");
        this.startMonth();
        this.weekSchedulerRoot.appendChild(this.weekdaysRootContainer);
    }

    getCurrentMonth() {
        let monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        let content = '<span class="selector-title">';
        let current = new Date();
        let weekstart = current.getDate() - current.getDay();
        let sunday = new Date(current.setDate(weekstart));
        let sundayGetMonth;
        let sundayGetDate;

        content += monthNames[current.getMonth()] + ' ' + current.getDate();
        current.setDate(current.getDate() + 6);
        content += ' - ' + monthNames[current.getMonth()] + ' ' + current.getDate();
        content += '</span>';
        content += '<span class="selector-content" tabindex="-1">';

        for (var m=0; m<=5; m++) {
            if (m==0) content += `<span class="active" w-period-week="${sunday}">`;
            content += `<span w-period-week="${sunday}">`;
            content += monthNames[sunday.getMonth()] + ' ' + sunday.getDate();
            sunday.setDate(sunday.getDate() + 6);
            content += ' - ' + monthNames[sunday.getMonth()] + ' ' + sunday.getDate();
            content += '</span>';
            sunday.setDate(sunday.getDate() + 1);
        }
        content += '</span>';
        return content;
    }

    startMonth() {
        let spinner = this.eventsRootContainer.querySelector('.spinner-container');
        spinner.classList.remove('hide');
        this.getJSON( this.getWeekEventsHandler, this.apiUrl, this.eventReqAttrs );
    }

    constructor(root) {
        if (!root) return;
        this.weekSchedulerRoot = root;
        this.getCurrentMonth();
        if (this.weekSchedulerRoot.parentNode.querySelector('.sliderLeftSelector') == null) {
            let leftSelector1 = new SelectorControls(this.weekSchedulerRoot.parentNode, 'sliderLeftSelector', this.getCurrentMonth(), 'w-period', this.update.bind(this));
            let RightSelector1 = new SelectorControls(this.weekSchedulerRoot.parentNode, 'sliderRightSelector', '<span class="selector-title">All Events</span><span class="selector-content" tabindex="-1"><span class="active" w-classificationId="">All Events</span><span w-classificationId="KZFzniwnSyZfZ7v7na">Arts & Theatre</span><span w-classificationId="KZFzniwnSyZfZ7v7nn">Film</span><span w-classificationId="KZFzniwnSyZfZ7v7n1">Miscellaneous</span><span w-classificationId="KZFzniwnSyZfZ7v7nJ">Music</span><span w-classificationId="KZFzniwnSyZfZ7v7nE">Sports</span></span>', 'classificationId', this.update.bind(this));
        }
        if (this.weekSchedulerRoot.querySelector('.days') == null) {
            this.weekdaysRootContainer = document.createElement("div");
            this.weekdaysRootContainer.classList.add("days");
            this.initMessage(this.weekSchedulerRoot);
            this.startMonth();
            this.weekSchedulerRoot.appendChild(this.weekdaysRootContainer);
        }
    }
}

class MonthScheduler {

    get apiUrl(){ return "https://app.ticketmaster.com/discovery/v2/events.json"; }

    get eventReqAttrs(){
        let calendarWidgetRoot = this.monthSchedulerRoot.parentNode.parentNode.parentNode;
        let tmapikey = '',
            latlong = '',
            keyword = '',
            radius;
        let attrs = {},
            params = [
                {
                    attr: 'tmapikey',
                    verboseName: 'apikey'
                },
                {
                    attr: 'keyword',
                    verboseName: 'keyword'
                },
                {
                    attr: 'size',
                    verboseName: 'size'
                },
                {
                    attr: 'city',
                    verboseName: 'city'
                },
                {
                    attr: 'countrycode',
                    verboseName: 'countryCode'
                },
                {
                    attr: 'radius',
                    verboseName: 'radius'
                },
                {
                    attr: 'classificationid',
                    verboseName: 'classificationId'
                },
                {
                    attr: 'attractionid',
                    verboseName: 'attractionId'
                },
                {
                    attr: 'promoterid',
                    verboseName: 'promoterId'
                },
                {
                    attr: 'venueid',
                    verboseName: 'venueId'
                },
                {
                    attr: 'segmentid',
                    verboseName: 'segmentId'
                },
                {
                    attr: 'page',
                    verboseName: 'page'
                }
            ];

        let date = new Date();
        let startmonth, startdate, endmonth, enddate, startDateTime, endDateTime;
        let classificationid = '';
        let countrycode = '';
        let city = '';
        let firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
        let lastDay = new Date(date.getFullYear(), date.getMonth() + 2, 0);

        if (firstDay.getMonth()+1 <=9) startmonth = '0' + (firstDay.getMonth()+1); else startmonth = firstDay.getMonth()+1;
        startdate = '0' + firstDay.getDate();
        if (lastDay.getMonth()+1 <=9) endmonth = '0' + (lastDay.getMonth()+1); else endmonth = lastDay.getMonth()+1;
        enddate = lastDay.getDate();
        startDateTime = firstDay.getFullYear() + '-' + startmonth + '-' + startdate + 'T00:00:00Z';
        endDateTime = lastDay.getFullYear() + '-' + endmonth + '-' + enddate + 'T23:59:59Z';

        if (calendarWidgetRoot.getAttribute("w-period") != 'week') {
            if (calendarWidgetRoot.getAttribute("w-period").length != 7) {
                firstDay =  new Date(date.getFullYear(), date.getMonth(), 1);
                lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 1);
            }
            else {
                firstDay = new Date(calendarWidgetRoot.getAttribute("w-period").substr(0, 4), calendarWidgetRoot.getAttribute("w-period").substr(5, 7), 0);
                lastDay = new Date(calendarWidgetRoot.getAttribute("w-period").substr(0, 4), calendarWidgetRoot.getAttribute("w-period").substr(5, 7), 0);
                firstDay.setDate(new Date(firstDay).getDate() - 1);
                lastDay.setDate(new Date(lastDay).getDate() + 1);
            }
            if (parseInt(firstDay.getMonth()+1) <= 9) startmonth = '0' + parseInt(firstDay.getMonth() + 1); else startmonth = parseInt(firstDay.getMonth() + 1);
            startdate = '0' + firstDay.getDate();
            if (lastDay.getMonth()+1 <= 9) endmonth = '0' + parseInt(lastDay.getMonth() + 1); else endmonth = parseInt(lastDay.getMonth()) + 1;
            if (lastDay.getDate()+1 <= 9) enddate = '0' + parseInt(lastDay.getDate() + 1); else enddate = parseInt(lastDay.getDate()) + 1;

            startDateTime = firstDay.getFullYear() + '-' + startmonth + '-01T00:00:00Z';
            endDateTime = lastDay.getFullYear() + '-' + endmonth + '-' + enddate + 'T23:59:59Z';
        }

        if (calendarWidgetRoot.getAttribute("w-tmapikey") != '') {
            tmapikey = calendarWidgetRoot.getAttribute("w-tmapikey");
            /*
            if (sessionStorage.getItem('tk-api-key')) {
                tmapikey = sessionStorage.getItem('tk-api-key');
                document.querySelector('[w-type="calendar"]').setAttribute("w-tmapikey", tmapikey);
            }
            */
        }

        if (calendarWidgetRoot.getAttribute("w-latlong") != '') {
            latlong = calendarWidgetRoot.getAttribute("w-latlong");
        }

        // if (latlong === null) latlong = '34.0390107,-118.2672801';

        if (calendarWidgetRoot.getAttribute("w-keyword") != '') {
            keyword = calendarWidgetRoot.getAttribute("w-keyword");
        }

        if (calendarWidgetRoot.getAttribute("w-radius") != '') {
            radius = calendarWidgetRoot.getAttribute("w-radius");
        }

        if (calendarWidgetRoot.getAttribute("w-classificationId") != '') {
            classificationid = calendarWidgetRoot.getAttribute("w-classificationId");
        }

        if (calendarWidgetRoot.getAttribute("w-countrycode") != null) {
            countrycode = calendarWidgetRoot.getAttribute("w-countrycode");
            latlong = '';
        }

        if (calendarWidgetRoot.getAttribute("w-city") != null) {
            city = calendarWidgetRoot.getAttribute("w-city");
            latlong = '';
        }

        return {
            "apikey": tmapikey,
            "latlong": latlong,
            "countryCode": countrycode,
            "city": city,
            "keyword": keyword,
            "startDateTime": startDateTime,
            "endDateTime": endDateTime,
            "classificationId": classificationid,
            "radius": radius,
            "size": "500",
            "page": 0
        }
    }

    get messageRootContainer(){ return 'monthScheduler'; }

    get hideMessageDelay(){ return 3000; }

    getJSON(handler, url=this.apiUrl, attrs={}, method="GET"){
        attrs = Object.keys(attrs).map(function(key){
            return `${key}=${attrs[key]}`;
        }).join("&");

        url = [url,attrs].join("?");
        let thisSchedulerRoot = this.monthSchedulerRoot.parentNode.parentNode.parentNode;
        if (thisSchedulerRoot.getAttribute('w-postalcodeapi') != null) url += '&postalCode=' + thisSchedulerRoot.getAttribute('w-postalcodeapi');
        url += '&sort=date,asc';

        this.xmlHTTP = window.XMLHttpRequest ? new XMLHttpRequest() : new ActiveXObject("Microsoft.XMLHTTP");
        if(method == "POST") {
            this.xmlHTTP.setRequestHeader("Content-type","application/x-www-form-urlencoded");
        }
        this.xmlHTTP.widget = this;
        this.xmlHTTP.onreadystatechange = handler;
        this.xmlHTTP.open(method, url, true);
        this.xmlHTTP.send();
    }

    getJsonAsync(url) {
        return new Promise(function (resolve, reject) {
            var xhr = new XMLHttpRequest();
            xhr.open('GET', url);

            xhr.onload = () => {
                if (xhr.status === 200) {
                    var result = JSON.parse(xhr.response);
                    resolve(result);
                } else {
                    reject("Error loading JSON!");
                }
            }
            xhr.onerror = () => {
                reject("Error loading JSON!");
            };
            xhr.send();
        });
    }

    formatDate(date) {
        var result = '';
        if(!date.day) return result; // Day is required

        function LZ(x) {
            return (x < 0 || x > 9 ? "" : "0") + x
        }
        var MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'],
            DAY_NAMES = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'],
            dayArray = date.day.split('-'),
            d = parseInt(dayArray[2]),
            M = parseInt(dayArray[1]);

        // var E = new Date(date.day).getDay();
        var E = new Date(+date.day.split('-')[0],(+date.day.split('-')[1])-1,+date.day.split('-')[2]).getDay();
        result = DAY_NAMES[E] + ', ' + MONTH_NAMES[M - 1] + ' ' + d + ', ' + dayArray[0];

        if(!date.time) return result;

        var timeArray = date.time.split(':'),
            H = parseInt(timeArray[0]),
            m = timeArray[1],
            a = "AM";

        if (H > 11) a = "PM";
        if (H == 0) {
            H = 12;
        } else if (H > 12) {
            H = H - 12;
        }

        return result + ' ' + LZ(H) + ':' + m + ' ' + a;
    }

    addScroll() {
        (function(n,t){function u(n){n.hasOwnProperty("data-simple-scrollbar")||Object.defineProperty(n,"data-simple-scrollbar",new SimpleScrollbar(n))}function e(n,i){function f(n){var t=n.pageY-u;u=n.pageY;r(function(){i.el.scrollTop+=t/i.scrollRatio})}function e(){n.classList.remove("ss-grabbed");t.body.classList.remove("ss-grabbed");t.removeEventListener("mousemove",f);t.removeEventListener("mouseup",e)}var u;n.addEventListener("mousedown",function(i){return u=i.pageY,n.classList.add("ss-grabbed"),t.body.classList.add("ss-grabbed"),t.addEventListener("mousemove",f),t.addEventListener("mouseup",e),!1})}function i(n){for(this.target=n,this.bar='<div class="ss-scroll">',this.wrapper=t.createElement("div"),this.wrapper.setAttribute("class","ss-wrapper"),this.el=t.createElement("div"),this.el.setAttribute("class","ss-content"),this.wrapper.appendChild(this.el);this.target.firstChild;)this.el.appendChild(this.target.firstChild);this.target.appendChild(this.wrapper);this.target.insertAdjacentHTML("beforeend",this.bar);this.bar=this.target.lastChild;e(this.bar,this);this.moveBar();this.el.addEventListener("scroll",this.moveBar.bind(this));this.el.addEventListener("mouseenter",this.moveBar.bind(this));this.target.classList.add("ss-container")}function f(){for(var i=t.querySelectorAll("*[ss-container]"),n=0;n<i.length;n++)u(i[n])}var r=n.requestAnimationFrame||n.setImmediate||function(n){return setTimeout(n,0)};i.prototype={moveBar:function(){var t=this.el.scrollHeight,i=this.el.clientHeight,n=this;this.scrollRatio=i/t;r(function(){n.bar.style.cssText="height:"+i/t*100+"%; top:"+n.el.scrollTop/t*100+"%;right:-"+(n.target.clientWidth-n.bar.clientWidth)+"px;"})}};t.addEventListener("DOMContentLoaded",f);i.initEl=u;i.initAll=f;n.SimpleScrollbar=i})(window,document)
        var scrollRoot = document.querySelectorAll(".ss");
        var maxL = scrollRoot.length;
        for (let ml = 0; ml < maxL; ml++) {
            SimpleScrollbar.initEl(scrollRoot[ml]);
        }
    }

    initMessage(schedulerRoot) {
        this.eventsRootContainer = schedulerRoot;
        this.messageDialogContainer = document.createElement('div');
        this.messageDialogContainer.classList.add("event-message-container");
        this.messageDialog = document.createElement('div');
        this.messageDialog.classList.add("event-message_");
        this.messageContent = document.createElement('div');
        this.messageContent.classList.add("event-message__content");

        let messageClose = document.createElement('div');
        messageClose.classList.add("event-message__btn");
        messageClose.addEventListener("click", ()=> {
            this.hideMessage();
        });

        this.messageDialog.appendChild(this.messageContent);
        this.messageDialog.appendChild(messageClose);
        this.messageDialogContainer.appendChild(this.messageDialog);
        this.eventsRootContainer.appendChild(this.messageDialogContainer);
    }

    showMessage(message, hideMessageWithoutDelay){

        if(message.length){
            this.hideMessageWithoutDelay = hideMessageWithoutDelay;
            this.messageContent.innerHTML = message;
            this.messageDialog.classList.add("event-message_-visible");
            if (this.messageTimeout) {
                clearTimeout(this.messageTimeout); // Clear timeout if before 'hideMessageWithDelay' was called
            }
        }
    }

    hideMessageWithDelay(delay){
        if(this.messageTimeout) clearTimeout(this.messageTimeout); // Clear timeout if this method was called before
        this.messageTimeout = setTimeout(()=>{
            this.hideMessage();
        }, delay);
    }

    hideMessage(){
        if(this.messageTimeout) clearTimeout(this.messageTimeout); // Clear timeout and hide message immediately.
        this.messageDialog.classList.remove("event-message_-visible");
    }

    startMonth() {
        let spinner = this.monthSchedulerRoot.querySelector('.spinner-container');
        spinner.classList.remove('hide');
        this.getJSON( this.getMonthEventsHandler, this.apiUrl, this.eventReqAttrs );
    }

    getMonthEventsHandler() {
        let events;
        let place;
        let address;
        let monthEvents = [];
        let widget = this.widget;
        let schedulerRoot = widget.monthSchedulerRoot;
        let calendarWidgetRoot = schedulerRoot.parentNode.parentNode.parentNode;
        let spinner = schedulerRoot.querySelector('.spinner-container');
        let prm = [];
        let url = 'https://app.ticketmaster.com/discovery/v2/events.json?apikey=aJVApdB1RoA41ejGebe0o4Ai9gufoCbd&latlong=36.1697096,-115.1236952&keyword=&startDateTime=2016-08-01T00:00:00Z&endDateTime=2016-09-02T23:59:59Z&classificationId=&radius=5&size=500&page=0&sort=date,asc';

        if (this && this.readyState == XMLHttpRequest.DONE) {

            if (this.status == 200) {
                events = JSON.parse(this.responseText);

                if (events.page.totalPages <= 1) {

                    spinner.classList.add('hide');

                    if (events.page.totalElements != 0) {
                        let currentMonth = calendarWidgetRoot.getAttribute('w-period').substr(5, 2);
                        let currentMonthDef = new Date(calendarWidgetRoot.getAttribute('w-period')).getMonth() + 1;
                        if (currentMonthDef <= 9) currentMonthDef = '0' + currentMonthDef;
                            if (currentMonth == '') {
                              currentMonth = new Date().getMonth() + 1;
                              if (parseInt(currentMonth) <= 9) currentMonth = '0' + currentMonth;
                            }
                        events._embedded.events.forEach(function (item) {
                            if (item.hasOwnProperty('_embedded') && item._embedded.hasOwnProperty('venues')) {
                                if (item._embedded.venues[0].hasOwnProperty('name')) {
                                    place = item._embedded.venues[0].name + ', ';
                                }
                                else {
                                    place = '';
                                }
                                if (item._embedded.venues[0].hasOwnProperty('address')) {
                                    address = item._embedded.venues[0].address.line1;
                                } else {
                                    address = '';
                                }
                            }
                            else {
                                place = '';
                                address = '';
                            }

                            let imgWidth;
                            let index;
                            item.images.forEach(function (img, i) {
                                if (i == 0) imgWidth = img.width;
                                if (imgWidth > img.width) {
                                    imgWidth = img.width;
                                    index = i;
                                }
                            });
                            if (currentMonth == item.dates.start.localDate.substr(5, 2) || currentMonthDef == item.dates.start.localDate.substr(5, 2)) {
                                if (+new Date( +new Date().getFullYear(), +new Date().getMonth(), + new Date().getDate()) <= +new Date(+item.dates.start.localDate.split('-')[0],(+item.dates.start.localDate.split('-')[1])-1,+item.dates.start.localDate.split('-')[2])) {
                                    monthEvents.push({
                                        'name': item.name,
                                        'date': item.dates.start.localDate,
                                        'time': item.dates.start.localTime,
                                        'datetime': widget.formatDate({
                                            day: item.dates.start.localDate,
                                            time: item.dates.start.localTime
                                        }),
                                        'place': place + address,
                                        'url': item.url,
                                        'img': (item.hasOwnProperty('images') && item.images[index] != undefined) ? item.images[index].url : '',
                                    });
                                }
                            }

                        });
                    }
                    else {
                        monthEvents[0] = ({
                            date: '',
                            time: '',
                        });
                        widget.showMessage("No results were found.<br/>Here other options for you.");
                        widget.hideMessageWithDelay(widget.hideMessageDelay);
                    }

                    let monthEventsSort = {};
                    let eventsArr = [];
                    let tDate = '';

                    if (monthEvents[0]) {
                        tDate = monthEvents[0].date;
                    }
                    else {
                        tDate = '';
                    }

                    for (let e = 0, l = monthEvents.length; e < l; e++) {
                        if (tDate == monthEvents[e].date) {
                            eventsArr.push(monthEvents[e]);
                            let day = tDate.toString().substr(8,2);
                            if (day.substr(0,1) == '0') day = day.substr(1,1);
                            monthEventsSort[day] = monthEvents[e];
                        }
                        else {
                            let day = tDate.toString().substr(8,2);
                            if (day.substr(0,1) == '0') day = day.substr(1,1);
                            monthEventsSort[day] = eventsArr;
                            eventsArr = [];
                            eventsArr.push(monthEvents[e]);
                        }
                        tDate = monthEvents[e].date;

                        if (eventsArr.lenght != 0) {
                            let dayNo = eventsArr[0].date.substr(8,2);
                            if (dayNo.substr(0,1) == '0') dayNo = dayNo.substr(1,1);
                            monthEventsSort[dayNo] = eventsArr;
                        }
                    }

                    let calendarClass = 'calendar';
                    let year = new Date().getFullYear();
                    let month = new Date().getMonth() + 1;


                    if (calendarWidgetRoot.getAttribute("w-period") != 'week') {
                        if (calendarWidgetRoot.getAttribute("w-period").length == 7) {
                            year = calendarWidgetRoot.getAttribute("w-period").substr(0, 4);
                            month = calendarWidgetRoot.getAttribute("w-period").substr(5, 7);
                        }
                    }

                    var elem = schedulerRoot.getElementsByClassName(calendarClass)[0];
                    var mon = parseInt(month) - 1;
                    var d = new Date(year, mon);
                    var table = '<table><tr><th>s</th><th>m</th><th>t</th><th>w</th><th>t</th><th>f</th><th>s</th></tr><tr>';
                    var tmpD = new Date(year, mon);
                    var outEnd = [];
                    for (var i = 0; i < d.getDay(); i++) {
                        tmpD.setDate(tmpD.getDate() - 1);
                        outEnd[i] = '<td class="dis">' + tmpD.getDate() + '</td>';
                    }
                    outEnd.reverse();
                    table += outEnd.join('');
                    let tableRowMonth = 0;
                    let tail_ = 'tail';
                    let popup_ = 'popup ';

                    while (d.getMonth() == mon) {
                        table += '<td';
                        if (new Date().getMonth() == d.getMonth() && new Date().getDate() == d.getDate()) table += ' class="today"';
                        table += '>';
                        if (monthEventsSort[d.getDate()] != undefined) {
                            let eventsCount = monthEventsSort[d.getDate()].length;
                            if (eventsCount === undefined) eventsCount = 1;
                            table += '<span class="round-holder"><span class="round">' + d.getDate() + '<span class="count">' + eventsCount + '</span></span></span>';

                            table += '<span class="' + tail_ + '"></span>';
                            table += '<div class="' + popup_ + ' ';
                            if (eventsCount == 1) table += 'single ';
                            table += 'ss" tabindex="-1">';

                            table += '<div class="ss-container">';

                            let url, img, name, datetime, place, eventsLenght;

                            if (monthEventsSort[d.getDate()].length == undefined) eventsLenght = 1;
                            else eventsLenght = monthEventsSort[d.getDate()].length;

                            for(let e=0, l = eventsLenght; e < l; e++) {
                                if (monthEventsSort[d.getDate()] && monthEventsSort[d.getDate()][e]) {
                                    url = monthEventsSort[d.getDate()][e].url;
                                    img = monthEventsSort[d.getDate()][e].img;
                                    name = monthEventsSort[d.getDate()][e].name;
                                    datetime = monthEventsSort[d.getDate()][e].datetime;
                                    place = monthEventsSort[d.getDate()][e].place;
                                }
                                else {
                                    url = monthEventsSort[d.getDate()].url;
                                    img = monthEventsSort[d.getDate()].img;
                                    name = monthEventsSort[d.getDate()].name;
                                    datetime = monthEventsSort[d.getDate()].datetime;
                                    place = monthEventsSort[d.getDate()].place;
                                }
                                table += '<span class="event">';
                                table += '<span class="event-holder">';
                                table += '<a href="' + url + '" target="_blank">';
                                if (img !=='' && img.length !== 0){
                                    table += '<span class="img bg-cover-default" style="background: url(' + img + ') center center no-repeat"></span>'
                                }else{ table += '<span class="img bg-cover-default" ></span>';}
                                table += '<span class="name">' + name + '</span>';
                                table += '</a>';
                                table += '<span class="date">' + datetime + '</span>';
                                table += '<span class="place">' + place + '</span>';
                                table += '</span>';
                                table += '</span>';
                            }

                            table += '</div>';
                            table += '</div>';
                        }
                        else {
                            table += d.getDate();
                        }
                        table += '</td>';

                        if (d.getDay() % 7 == 6) {
                            tableRowMonth++;
                            if (tableRowMonth > 1) {
                                tail_ = 'tail-up';
                                popup_ = 'popup-up ';
                            }
                            table += '</tr><tr>';
                        }

                        d.setDate(d.getDate() + 1);
                    }
                    if (d.getDay() != 0) {
                        d.setDate(d.getDate() - 1);
                        for (var i = d.getDay(); i < 6; i++) {
                            d.setDate(d.getDate() + 1);
                            table += '<td class="dis">' + d.getDate() + '</td>';
                        }
                    }
                    table += '</tr></table><span class="month-update"></span>';
                    elem.innerHTML = table;
                    widget.addScroll();

                }
                else {
                    monthEvents = [];
                    let monthEventsConcat = [];
                    let l = parseInt(events.page.totalPages)-1;
                    for (i = 0; i <= l; i++) {
                        let attrs = widget.eventReqAttrs;
                        attrs.page = i;
                        attrs = Object.keys(attrs).map(function (key) {
                            return `${key}=${attrs[key]}`;
                        }).join("&");
                        let url;
                        url= widget.apiUrl + [url, attrs].join("?");
                        let thisSchedulerRoot = widget.monthSchedulerRoot.parentNode.parentNode.parentNode;
                        if (thisSchedulerRoot.getAttribute('w-postalcodeapi') != null) url += '&postalCode=' + thisSchedulerRoot.getAttribute('w-postalcodeapi');
                        url += '&sort=date,asc';
                        prm.push(widget.getJsonAsync(url));
                    }

                    Promise.all(prm).then(value => {
                        spinner.classList.add('hide');
                        let le = value.length + 1;
                        var curMonth;
                        if (calendarWidgetRoot.getAttribute("w-period") == 'week') {
                            curMonth = new Date().getMonth() + 1;
                        }
                        else {
                            if (calendarWidgetRoot.getAttribute("w-period").substr(5, 1) == '0') {
                                curMonth = calendarWidgetRoot.getAttribute("w-period").substr(6, 1);
                            }
                            else {
                                curMonth = calendarWidgetRoot.getAttribute("w-period").substr(5, 2);
                            }
                        }
                        for (let e = 0; e <= le; e++) {
                            if(value[e] && value[e]._embedded && value[e]._embedded.events){
                                value[e]._embedded.events.forEach(function (item) {
                                    if (item.hasOwnProperty('_embedded') && item._embedded.hasOwnProperty('venues')) {
                                        if (item._embedded.venues[0].hasOwnProperty('name')) {
                                            place = item._embedded.venues[0].name + ', ';
                                        }
                                        else {
                                            place = '';
                                        }
                                        if (item._embedded.venues[0].hasOwnProperty('address')) {
                                            address = item._embedded.venues[0].address.line1;
                                        } else {
                                            address = '';
                                        }
                                    }
                                    else {
                                        place = '';
                                        address = '';
                                    }

                                    let imgWidth;
                                    let index;
                                    if (item.hasOwnProperty('images')) {
                                        item.images.forEach(function (img, i) {
                                            if (i == 0) imgWidth = img.width;
                                            if (imgWidth > img.width) {
                                                imgWidth = img.width;
                                                index = i;
                                            }
                                        });
                                    }
                                    let newDate = item.dates.start.localDate.substr(5,2);
                                    if (parseInt(curMonth) === parseInt(newDate))  {
                                        if (+new Date( +new Date().getFullYear(), +new Date().getMonth(), +new Date().getDate()) <= +new Date(+item.dates.start.localDate.split('-')[0],(+item.dates.start.localDate.split('-')[1])-1,+item.dates.start.localDate.split('-')[2])) {
                                            monthEvents.push({
                                                'name': item.name,
                                                'date': item.dates.start.localDate,
                                                'time': item.dates.start.localTime,
                                                'datetime': widget.formatDate({
                                                    day: item.dates.start.localDate,
                                                    time: item.dates.start.localTime
                                                }),
                                                'place': place + address,
                                                'url': item.url,
                                                'img': (item.hasOwnProperty('images') && item.images[index] != undefined) ? item.images[index].url : '',
                                            });
                                        }
                                    }
                                });
                            }
                        }
                        monthEventsConcat.push(monthEvents);
                        monthEvents = monthEventsConcat[0];

                        let monthEventsSort = {};
                        let eventsArr = [];
                        let tDate = '';
                        if (monthEvents[0]) {
                            tDate = monthEvents[0].date;
                        }
                        else {
                            tDate = '';
                        }

                        for (let e = 0, l = monthEvents.length; e < l; e++) {
                            if (tDate == monthEvents[e].date) {
                                eventsArr.push(monthEvents[e]);
                                let day = tDate.toString().substr(8,2);
                                if (day.substr(0,1) == '0') day = day.substr(1,1);
                                monthEventsSort[day] = monthEvents[e];
                            }
                            else {
                                let day = tDate.toString().substr(8,2);
                                if (day.substr(0,1) == '0') day = day.substr(1,1);
                                monthEventsSort[day] = eventsArr;
                                eventsArr = [];
                                eventsArr.push(monthEvents[e]);
                            }
                            tDate = monthEvents[e].date;

                            if (eventsArr.lenght != 0) {
                                let dayNo = eventsArr[0].date.substr(8,2);
                                if (dayNo.substr(0,1) == '0') dayNo = dayNo.substr(1,1);
                                monthEventsSort[dayNo] = eventsArr;
                            }
                        }

                        let calendarClass = 'calendar';
                        let year = new Date().getFullYear();
                        let month = new Date().getMonth() + 1;


                        if (calendarWidgetRoot.getAttribute("w-period") != 'week') {
                            if (calendarWidgetRoot.getAttribute("w-period").length == 7) {
                                year = calendarWidgetRoot.getAttribute("w-period").substr(0, 4);
                                month = calendarWidgetRoot.getAttribute("w-period").substr(5, 7);
                            }
                        }

                        var elem = schedulerRoot.getElementsByClassName(calendarClass)[0];
                        var mon = parseInt(month) - 1;
                        var d = new Date(year, mon);
                        var table = '<table><tr><th>s</th><th>m</th><th>t</th><th>w</th><th>t</th><th>f</th><th>s</th></tr><tr>';
                        var tmpD = new Date(year, mon);
                        var outEnd = [];
                        for (var i = 0; i < d.getDay(); i++) {
                            tmpD.setDate(tmpD.getDate() - 1);
                            outEnd[i] = '<td class="dis">' + tmpD.getDate() + '</td>';
                        }
                        outEnd.reverse();
                        table += outEnd.join('');
                        let tableRowMonth = 0;
                        let tail_ = 'tail';
                        let popup_ = 'popup ';

                        while (d.getMonth() == mon) {
                            table += '<td';
                            if (new Date().getMonth() == d.getMonth() && new Date().getDate() == d.getDate()) table += ' class="today"';
                            table += '>';
                            if (monthEventsSort[d.getDate()] != undefined) {
                                let eventsCount = monthEventsSort[d.getDate()].length;
                                if (eventsCount === undefined) eventsCount = 1;
                                table += '<span class="round-holder"><span class="round">' + d.getDate() + '<span class="count">' + eventsCount + '</span></span></span>';

                                table += '<span class="' + tail_ + '"></span>';
                                table += '<div class="' + popup_ + ' ';
                                if (eventsCount == 1) table += 'single ';
                                table += 'ss" tabindex="-1">';

                                table += '<div class="ss-container">';

                                let url, img, name, datetime, place, eventsLenght;

                                if (monthEventsSort[d.getDate()].length == undefined) eventsLenght = 1;
                                else eventsLenght = monthEventsSort[d.getDate()].length;

                                for(let e=0, l = eventsLenght; e < l; e++) {
                                    if (monthEventsSort[d.getDate()] && monthEventsSort[d.getDate()][e]) {
                                        url = monthEventsSort[d.getDate()][e].url;
                                        img = monthEventsSort[d.getDate()][e].img;
                                        name = monthEventsSort[d.getDate()][e].name;
                                        datetime = monthEventsSort[d.getDate()][e].datetime;
                                        place = monthEventsSort[d.getDate()][e].place;
                                    }
                                    else {
                                        url = monthEventsSort[d.getDate()].url;
                                        img = monthEventsSort[d.getDate()].img;
                                        name = monthEventsSort[d.getDate()].name;
                                        datetime = monthEventsSort[d.getDate()].datetime;
                                        place = monthEventsSort[d.getDate()].place;
                                    }
                                    table += '<span class="event">';
                                    table += '<span class="event-holder">';
                                    table += '<a href="' + url + '" target="_blank">';
                                    if (img !=='' && img.length !== 0){
                                        table += '<span class="img bg-cover-default" style="background: url(' + img + ') center center no-repeat"></span>'
                                    }else{ table += '<span class="img bg-cover-default" ></span>';}
                                    table += '<span class="name">' + name + '</span>';
                                    table += '</a>';
                                    table += '<span class="date">' + datetime + '</span>';
                                    table += '<span class="place">' + place + '</span>';
                                    table += '</span>';
                                    table += '</span>';
                                }

                                table += '</div>';
                                table += '</div>';
                            }
                            else {
                                table += d.getDate();
                            }
                            table += '</td>';

                            if (d.getDay() % 7 == 6) {
                                tableRowMonth++;
                                if (tableRowMonth > 1) {
                                    tail_ = 'tail-up';
                                    popup_ = 'popup-up ';
                                }
                                table += '</tr><tr>';
                            }

                            d.setDate(d.getDate() + 1);
                        }
                        if (d.getDay() != 0) {
                            d.setDate(d.getDate() - 1);
                            for (var i = d.getDay(); i < 6; i++) {
                                d.setDate(d.getDate() + 1);
                                table += '<td class="dis">' + d.getDate() + '</td>';
                            }
                        }
                        table += '</tr></table><span class="month-update"></span>';
                        elem.innerHTML = table;
                        widget.addScroll();


                        var rounds = schedulerRoot.querySelectorAll("span.round-holder");
                        for (var x = 0; x < rounds.length; x++) {
                            rounds[x].addEventListener("click", function (e) {
                                this.classList.add("active");
                                this.nextElementSibling.classList.add("show");
                                this.nextElementSibling.nextElementSibling.classList.add("show");
                                this.nextElementSibling.nextElementSibling.focus();
                            }, false);
                        }

                        var popups = schedulerRoot.querySelectorAll(".popup, .popup-up");
                        for (var y = 0; y < popups.length; y++) {
                            popups[y].addEventListener("blur", function (e) {
                                let self = this;
                                setTimeout(function () {
                                    self.previousElementSibling.classList.remove("show");
                                    self.classList.remove("show");
                                    self.previousElementSibling.previousElementSibling.classList.remove('active');
                                }, 127);
                            }, false);
                        }

                        var monthUpdate = schedulerRoot.getElementsByClassName('month-update')[0];
                        if (monthUpdate != null) {
                            monthUpdate.addEventListener('click', function () {
                                widget.update();
                            });
                        }

                    }, reason => {
                        console.log(reason)
                    });
                }

            }
            else if (this.status == 400) {
                console.log('There was an error 400');
            }
            else {
                console.log('something else other than 200 was returned');
            }
        }

        var rounds = schedulerRoot.querySelectorAll("span.round-holder");
        for (var x = 0; x < rounds.length; x++) {
            rounds[x].addEventListener("click", function (e) {
                this.classList.add("active");
                this.nextElementSibling.classList.add("show");
                this.nextElementSibling.nextElementSibling.classList.add("show");
                this.nextElementSibling.nextElementSibling.focus();
            }, false);
        }

        var popups = schedulerRoot.querySelectorAll(".popup, .popup-up");
        for (var y = 0; y < popups.length; y++) {
            popups[y].addEventListener("blur", function (e) {
                let self = this;
                setTimeout(function () {
                    self.previousElementSibling.classList.remove("show");
                    self.classList.remove("show");
                    self.previousElementSibling.previousElementSibling.classList.remove('active');
                }, 127);
            }, false);
        }

        var monthUpdate = schedulerRoot.getElementsByClassName('month-update')[0];
        if (monthUpdate != null) {
            monthUpdate.addEventListener('click', function () {
                widget.update();
            });
        }

    }

    getMonthes() {
        var MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];
        let year = new Date().getFullYear();
        let month = new Date().getMonth();
        let nowMonth = new Date().getMonth();
        let nowMonthTmp = nowMonth;
        let calendarWidgetRoot = this.monthSchedulerRoot.parentNode.parentNode.parentNode;

        if (calendarWidgetRoot.getAttribute("w-period") != 'week') {

            if (calendarWidgetRoot.getAttribute("w-period").length != 7) {
                year =  new Date().getFullYear();
                month = new Date().getMonth() + 1;
                if (month <= 9) month = '0' + month;
                nowMonth = new Date().getMonth();
            }
            else {
                year = calendarWidgetRoot.getAttribute("w-period").substr(0,4);
                month = calendarWidgetRoot.getAttribute("w-period").substr(5,2);
                nowMonth = calendarWidgetRoot.getAttribute("w-period").substr(5,2);
                if (calendarWidgetRoot.getAttribute("w-period").substr(5,1) == '0') nowMonth = calendarWidgetRoot.getAttribute("w-period").substr(6,1);
                nowMonth = parseInt(nowMonth - 1);
            }
            nowMonthTmp = nowMonth;
            if (new Date().getFullYear() != year) {
                nowMonth = 0;
            }
            else {
                nowMonth = new Date().getMonth();
            }
        }

        let content = '';
        content += '<span class="selector-title">' + MONTH_NAMES[nowMonthTmp]+ '</span>';
        content += '<span class="selector-content" tabindex="-1">';

        let countMonth = 11;
        if (new Date().getFullYear() != year) countMonth = 6;
        for (let i = nowMonth; i<=countMonth; i++) {
            content += '<span ';
            if (i == nowMonth) content += 'class="active" ';
            if (i < 9) month = '0' + parseInt(i+1); else month = parseInt(i+1);
            content += 'w-period="' + year + '-' + month + '">' + MONTH_NAMES[i] + '</span>';
        }
        content += '</span>';
        return content;
    }

    getCategories() {
        let calendarWidgetRoot = this.monthSchedulerRoot.parentNode.parentNode.parentNode;
        let active = calendarWidgetRoot.getAttribute('w-classificationid');
        let activeId = calendarWidgetRoot.getAttribute('w-classificationid');
        switch (active) {
            case 'KZFzniwnSyZfZ7v7na':
                active = 'Arts & Theatre';
                break
            case 'KZFzniwnSyZfZ7v7nn':
                active = 'Film';
                break
            case 'KZFzniwnSyZfZ7v7n1':
                active = 'Miscellaneous';
                break
            case 'KZFzniwnSyZfZ7v7nJ':
                active = 'Music';
                break
            case 'KZFzniwnSyZfZ7v7nE':
                active = 'Sports';
                break
            default:
                active = 'All Events';
        }
        let content = '<span class="selector-title" w-classificationid="' + activeId + '">';
        content += active;
        content += '</span>';
        content += '<span class="selector-content" tabindex="-1">';
        content += '<span class="active" w-classificationId="">All Events</span>';
        content += '<span w-classificationId="KZFzniwnSyZfZ7v7na">Arts & Theatre</span>';
        content += '<span w-classificationId="KZFzniwnSyZfZ7v7nn">Film</span>';
        content += '<span w-classificationId="KZFzniwnSyZfZ7v7n1">Miscellaneous</span>';
        content += '<span w-classificationId="KZFzniwnSyZfZ7v7nJ">Music</span>';
        content += '<span w-classificationId="KZFzniwnSyZfZ7v7nE">Sports</span>';
        content += '</span>';
        return content;
    }

    update() {
        let schedulerRoot = this.monthSchedulerRoot;
        let delLeftselector = schedulerRoot.parentNode.getElementsByClassName('sliderLeftSelector')[0];
        delLeftselector.parentElement.removeChild(delLeftselector);
        let delRightselector = schedulerRoot.parentNode.getElementsByClassName('sliderRightSelector')[0];
        delRightselector.parentElement.removeChild(delRightselector);

        let leftSelector = new SelectorControls(schedulerRoot.parentNode, 'sliderLeftSelector', this.getMonthes(), 'period', this.update.bind(this));
        let RightSelector = new SelectorControls(schedulerRoot.parentNode, 'sliderRightSelector', this.getCategories(), 'classificationId', this.update.bind(this));
        let month = schedulerRoot.getElementsByClassName('calendar')[0];
        schedulerRoot.removeChild(month);
        this.monthRootContainer = document.createElement("div");
        this.monthRootContainer.classList.add("calendar");
        schedulerRoot.appendChild(this.monthRootContainer);
        this.startMonth();
    }

    constructor(root) {
        if (!root) return;
        this.monthSchedulerRoot = root;
        if (this.monthSchedulerRoot.parentNode.querySelector('.sliderLeftSelector') == null) {
            let leftSelector = new SelectorControls(this.monthSchedulerRoot.parentNode, 'sliderLeftSelector', this.getMonthes(), 'period', this.update.bind(this));
            let RightSelector = new SelectorControls(this.monthSchedulerRoot.parentNode, 'sliderRightSelector', this.getCategories(), 'classificationId', this.update.bind(this));
        }
        if (this.monthSchedulerRoot.querySelector('.calendar') == null) {
            this.initMessage(this.monthSchedulerRoot);
            this.calendarRootContainer = document.createElement("div");
            this.calendarRootContainer.classList.add("calendar");
            this.monthSchedulerRoot.appendChild(this.calendarRootContainer);
            this.startMonth();
        }
    }


}

class YearScheduler {

    get apiUrl(){ return "https://app.ticketmaster.com/discovery/v2/events.json"; }

    get eventReqAttrs(){
        let calendarWidgetRoot = this.yearSchedulerRoot.parentNode.parentNode.parentNode;
        let tmapikey = '',
            keyword = '',
            radius;
        let attrs = {},
            params = [
                {
                    attr: 'tmapikey',
                    verboseName: 'apikey'
                },
                {
                    attr: 'keyword',
                    verboseName: 'keyword'
                },
                {
                    attr: 'city',
                    verboseName: 'city'
                },
                {
                    attr: 'countrycode',
                    verboseName: 'countryCode'
                },
                {
                    attr: 'size',
                    verboseName: 'size'
                },
                {
                    attr: 'radius',
                    verboseName: 'radius'
                },
                {
                    attr: 'classificationid',
                    verboseName: 'classificationId'
                },
                {
                    attr: 'attractionid',
                    verboseName: 'attractionId'
                },
                {
                    attr: 'promoterid',
                    verboseName: 'promoterId'
                },
                {
                    attr: 'venueid',
                    verboseName: 'venueId'
                },
                {
                    attr: 'segmentid',
                    verboseName: 'segmentId'
                }
            ];

        let date = new Date();
        let startmonth, startdate, endmonth, enddate, startDateTime, endDateTime;
        let classificationid = '';
        let countrycode = '';
        let city = '';
        let firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
        let lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);
        let latlong = '34.0390107,-118.2672801';

        if (firstDay.getMonth()+1 <=9) startmonth = '0' + (firstDay.getMonth()+1); else startmonth = firstDay.getMonth()+1;
        startdate = '0' + firstDay.getDate();
        if (lastDay.getMonth()+1 <=9) endmonth = '0' + (lastDay.getMonth()+1); else endmonth = lastDay.getMonth()+1;
        enddate = lastDay.getDate();
        startDateTime = firstDay.getFullYear() + '-' + startmonth + '-' + startdate + 'T00:00:00Z';
        endDateTime = lastDay.getFullYear() + '-12-31T23:59:59Z';

        if (calendarWidgetRoot.getAttribute("w-period") != 'week') {

            if (calendarWidgetRoot.getAttribute("w-period").length != 4) {
                firstDay =  new Date(date.getFullYear()) + '-01-01T00:00:00Z';
                lastDay = new Date(date.getFullYear()) + '-12-31T23:59:59Z';
            }
            else {
                firstDay = calendarWidgetRoot.getAttribute("w-period") + '-01-01T00:00:00Z';
                lastDay = parseInt(firstDay + 1) + '-12-31T23:59:59Z';
            }
            startDateTime = firstDay;
            endDateTime = lastDay;
        }

        if (calendarWidgetRoot.getAttribute("w-tmapikey") != '') {
            tmapikey = calendarWidgetRoot.getAttribute("w-tmapikey");
            /*
            if (sessionStorage.getItem('tk-api-key')) {
                tmapikey = sessionStorage.getItem('tk-api-key');
                calendarWidgetRoot.setAttribute("w-tmapikey", tmapikey);
            }
            */
        }

        if (calendarWidgetRoot.getAttribute("w-latlong") != '') {
            latlong = document.querySelector('[w-type="calendar"]').getAttribute("w-latlong");
        }

        // if (latlong === null) latlong = '34.0390107,-118.2672801';

        if (calendarWidgetRoot.getAttribute("w-keyword") != '') {
            keyword = calendarWidgetRoot.getAttribute("w-keyword");
        }

        if (calendarWidgetRoot.getAttribute("w-radius") != '') {
            radius = calendarWidgetRoot.getAttribute("w-radius");
        }

        if (calendarWidgetRoot.getAttribute("w-classificationId") != '') {
            classificationid = calendarWidgetRoot.getAttribute("w-classificationId");
        }

        if (calendarWidgetRoot.getAttribute("w-countrycode") != null) {
            countrycode = calendarWidgetRoot.getAttribute("w-countrycode");
            latlong = '';
        }

        if (calendarWidgetRoot.getAttribute("w-city") != null) {
            city = calendarWidgetRoot.getAttribute("w-city");
            latlong = '';
        }

        return {
            "apikey": tmapikey,
            "latlong": latlong,
            "countryCode": countrycode,
            "city": city,
            "keyword": keyword,
            "startDateTime": startDateTime,
            "endDateTime": endDateTime,
            "classificationId": classificationid,
            "radius": radius,
            "size": "1"
        }
    }

    get messageRootContainer(){ return 'yearScheduler'; }

    get hideMessageDelay(){ return 3000; }

    getJsonAsync(url) {
        return new Promise(function (resolve, reject) {
            var xhr = new XMLHttpRequest();
            xhr.open('GET', url);

            xhr.onload = () => {
                if (xhr.status === 200) {
                    var result = JSON.parse(xhr.response);
                    resolve(result.page.totalElements);
                } else {
                    reject("Error loading JSON!");
                }
            }
            xhr.onerror = () => {
                reject("Error loading JSON!");
            };
            xhr.send();
        });
    }

    formatDate(date) {
        var result = '';
        if(!date.day) return result; // Day is required

        function LZ(x) {
            return (x < 0 || x > 9 ? "" : "0") + x
        }
        var MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'],
            DAY_NAMES = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'],
            dayArray = date.day.split('-'),
            d = parseInt(dayArray[2]),
            M = parseInt(dayArray[1]);

        // var E = new Date(date.day).getDay();
        var E = new Date(+date.day.split('-')[0],(+date.day.split('-')[1])-1,+date.day.split('-')[2]).getDay();
        result = DAY_NAMES[E] + ', ' + MONTH_NAMES[M - 1] + ' ' + d + ', ' + dayArray[0];

        if(!date.time) return result;

        var timeArray = date.time.split(':'),
            H = parseInt(timeArray[0]),
            m = timeArray[1],
            a = "AM";

        if (H > 11) a = "PM";
        if (H == 0) {
            H = 12;
        } else if (H > 12) {
            H = H - 12;
        }

        return result + ' ' + LZ(H) + ':' + m + ' ' + a;
    }

    addScroll() {
        (function(n,t){function u(n){n.hasOwnProperty("data-simple-scrollbar")||Object.defineProperty(n,"data-simple-scrollbar",new SimpleScrollbar(n))}function e(n,i){function f(n){var t=n.pageY-u;u=n.pageY;r(function(){i.el.scrollTop+=t/i.scrollRatio})}function e(){n.classList.remove("ss-grabbed");t.body.classList.remove("ss-grabbed");t.removeEventListener("mousemove",f);t.removeEventListener("mouseup",e)}var u;n.addEventListener("mousedown",function(i){return u=i.pageY,n.classList.add("ss-grabbed"),t.body.classList.add("ss-grabbed"),t.addEventListener("mousemove",f),t.addEventListener("mouseup",e),!1})}function i(n){for(this.target=n,this.bar='<div class="ss-scroll">',this.wrapper=t.createElement("div"),this.wrapper.setAttribute("class","ss-wrapper"),this.el=t.createElement("div"),this.el.setAttribute("class","ss-content"),this.wrapper.appendChild(this.el);this.target.firstChild;)this.el.appendChild(this.target.firstChild);this.target.appendChild(this.wrapper);this.target.insertAdjacentHTML("beforeend",this.bar);this.bar=this.target.lastChild;e(this.bar,this);this.moveBar();this.el.addEventListener("scroll",this.moveBar.bind(this));this.el.addEventListener("mouseenter",this.moveBar.bind(this));this.target.classList.add("ss-container")}function f(){for(var i=t.querySelectorAll("*[ss-container]"),n=0;n<i.length;n++)u(i[n])}var r=n.requestAnimationFrame||n.setImmediate||function(n){return setTimeout(n,0)};i.prototype={moveBar:function(){var t=this.el.scrollHeight,i=this.el.clientHeight,n=this;this.scrollRatio=i/t;r(function(){n.bar.style.cssText="height:"+i/t*100+"%; top:"+n.el.scrollTop/t*100+"%;right:-"+(n.target.clientWidth-n.bar.clientWidth)+"px;"})}};t.addEventListener("DOMContentLoaded",f);i.initEl=u;i.initAll=f;n.SimpleScrollbar=i})(window,document)
        var scrollRoot = document.querySelectorAll(".ss");
        var maxL = scrollRoot.length;
        for (let ml = 0; ml < maxL; ml++) {
            SimpleScrollbar.initEl(scrollRoot[ml]);
        }
    }

    initMessage(schedulerRoot){
        this.eventsRootContainer = schedulerRoot;
        this.messageDialogContainer = document.createElement('div');
        this.messageDialogContainer.classList.add("event-message-container");
        this.messageDialog = document.createElement('div');
        this.messageDialog.classList.add("event-message_");
        this.messageContent = document.createElement('div');
        this.messageContent.classList.add("event-message__content");

        let messageClose = document.createElement('div');
        messageClose.classList.add("event-message__btn");
        messageClose.addEventListener("click", ()=> {
            this.hideMessage();
        });

        this.messageDialog.appendChild(this.messageContent);
        this.messageDialog.appendChild(messageClose);
        this.messageDialogContainer.appendChild(this.messageDialog);
        this.eventsRootContainer.appendChild(this.messageDialogContainer);
    }

    showMessage(message, hideMessageWithoutDelay){

        if(message.length){
            this.hideMessageWithoutDelay = hideMessageWithoutDelay;
            this.messageContent.innerHTML = message;
            this.messageDialog.classList.add("event-message_-visible");
            if (this.messageTimeout) {
                clearTimeout(this.messageTimeout); // Clear timeout if before 'hideMessageWithDelay' was called
            }
        }
    }

    hideMessageWithDelay(delay){
        if(this.messageTimeout) clearTimeout(this.messageTimeout); // Clear timeout if this method was called before
        this.messageTimeout = setTimeout(()=>{
            this.hideMessage();
        }, delay);
    }

    hideMessage(){
        if(this.messageTimeout) clearTimeout(this.messageTimeout); // Clear timeout and hide message immediately.
        this.messageDialog.classList.remove("event-message_-visible");
    }

    getYears() {
        let now = new Date().getFullYear();
        let content = '';
        content += '<span class="selector-title">Events in ' + now + '</span>';
        content += '<span class="selector-content" tabindex="-1">';
        for (let i = (now-1); i<(now+1); i++) {
            content += '<span ';
            if (i == now) content += 'class="active" ';
            content += 'w-period="' + (i+1) + '">Events in ' + (i+1) + '</span>';
        }
        content += '</span>';
        return content;
    }

    getLastDayOfMonth(year, month) {
        var date = new Date(year, month + 1, 0);
        return date.getDate();
    }

    startYear() {
        let MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
        let prm = [];
        let year;
        let schedulerRoot = this.yearSchedulerRoot.parentNode.parentNode.parentNode;
        if (schedulerRoot.getAttribute("w-period").length != 4) {
            year = new Date().getFullYear();
        }
        else {
            year = this.eventReqAttrs.startDateTime.substring(0,4);
        }

        let month = '01';

        var xhr = new XMLHttpRequest();
        var resp, dateOffset;


        let latlongOffset = schedulerRoot.getAttribute("w-latlong");
        if (latlongOffset != null) {
            xhr.open('GET', 'https://maps.googleapis.com/maps/api/timezone/json?language=en&location=' + schedulerRoot.getAttribute("w-latlong") + '&timestamp=1331161200');
            xhr.onload = function (e) {
                if (xhr.readyState == 4 && xhr.status == 200) {
                    resp = JSON.parse(xhr.responseText);
                    dateOffset = parseInt(resp.rawOffset) + parseInt(resp.dstOffset);
                }
            };
            xhr.send(null);
        }
        else {
            dateOffset = undefined;
        }

        var currentMonth = parseInt(new Date().getMonth()) + 1;

        for(let i = 1; i <= 12; i++) {

            if (i<=9) month = '0' + i; else month = i;
            let attrs = this.eventReqAttrs;

            if (dateOffset !== undefined) {
                var startDT = new Date(new Date(year, (i-1), 1, 0, 0, 0, 0).valueOf() - dateOffset*1000);
                var finishDT = new Date(new Date(year, (i-1), this.getLastDayOfMonth(year, (i-1)), 23, 59, 59, 0).valueOf() - dateOffset*1000);
                var startY = startDT.getFullYear();
                var startM = startDT.getMonth() + 1;
                if (startM <= 9) startM = '0' + startM;
                var startD = startDT.getDate();
                if (startD <= 9) startD = '0' + startD;
                var startH = startDT.getHours();
                if (startDT.getHours() <= 9) startH = '0' + startDT.getHours();
                var startMn = startDT.getMinutes();
                if (startDT.getMinutes() <= 9) startMn = '0' + startDT.getMinutes();
                var startS = startDT.getSeconds();
                if (startDT.getSeconds() <= 9) startS = '0' + startDT.getSeconds();
                var finishY = finishDT.getFullYear();
                var finishM = finishDT.getMonth() + 1;
                if (finishM <= 9) finishM = '0' + finishM;
                var finishD = finishDT.getDate();
                if (finishD <= 9) finishD = '0' + finishD;
                var finishH = finishDT.getHours();
                if (finishDT.getHours() <= 9) finishH = '0' + finishDT.getHours();
                var finishMn = finishDT.getMinutes();
                if (finishDT.getMinutes() <= 9) finishMn = '0' + finishDT.getMinutes();
                var finishS = finishDT.getSeconds();
                if (finishDT.getSeconds() <= 9) finishS = '0' + finishDT.getSeconds();
                attrs.startDateTime = startY + '-' + startM + '-' + startD + 'T' + startH + ':' + startMn + ':' + startS + 'Z';
                attrs.endDateTime = finishY + '-' + finishM + '-' + finishD + 'T' + finishH + ':' + finishMn + ':' + finishS + 'Z';
            }
            else {
                var currentMonth = parseInt(new Date().getMonth()) + 1;
                if (currentMonth <=9) currentMonth = '0' + currentMonth;
                var currentDay = new Date().getDate();
                if (currentDay <=9) currentDay = '0' + currentDay;
                if (!(year == new Date().getFullYear() && month == currentMonth)) currentDay = '01';
                attrs.startDateTime = year + '-' + month + '-' + currentDay + 'T00:00:00Z';
                attrs.endDateTime = year + '-' + month + '-' + this.getLastDayOfMonth(year, (i - 1)) + 'T23:59:59Z';
            }
            attrs = Object.keys(attrs).map(function(key){
                return `${key}=${attrs[key]}`;
            }).join("&");
            let url;
            url = this.apiUrl + [url,attrs].join("?");
            let thisSchedulerRoot = this.yearSchedulerRoot.parentNode.parentNode.parentNode;
            if (thisSchedulerRoot.getAttribute('w-postalcodeapi') != null) url += '&postalCode=' + thisSchedulerRoot.getAttribute('w-postalcodeapi');
            url += '&sort=date,asc';
            prm.push(this.getJsonAsync(url));
        }


        Promise.all(prm).then(value => {
            var elem = this.yearSchedulerRoot.querySelector(".year");
            let table = '<div class="monthes-container">';
            let month;
            let curMonth = new Date().getMonth();
            let curYear = new Date().getFullYear();
            let noResults = true;
            let messageContainer = schedulerRoot.querySelector('.event-message-container');

            for (var i = 0; i < MONTH_NAMES.length; i++) {
                table += '<div class="month">';
                table += '<span class="name';
                if (year == curYear && curMonth == i) table += ' current';
                table += '">' + MONTH_NAMES[i] + '</span>';
                if (parseInt(i+1) <= 9) month = '0' + parseInt(i+1); else month = parseInt(i+1);
                if (value[i] !=0) table += '<a href="javascript:void(0)" class="count" rel="' + year + '-' + month + '">' + value[i] + '</a>';
                table += '</div>';
                if (value[i] != 0) noResults = false;
            }
            table += '</div>';
            elem.innerHTML = table;

            this.yearSchedulerRoot.getElementsByClassName('spinner-container')[0].classList.add('hide');

            if (noResults === true) {
                this.showMessage("No results were found.<br/>Here other options for you.", true);
                this.hideMessageWithDelay(this.hideMessageDelay);
            }

            var rounds = schedulerRoot.querySelectorAll("a.count");
            for (var x = 0; x < rounds.length; x++) {
                rounds[x].addEventListener("click", function (e) {
                    schedulerRoot.setAttribute('w-period', e.target.getAttribute('rel'));
                    schedulerRoot.querySelectorAll('.tb')[2].click();
                    schedulerRoot.getElementsByClassName('month-update')[0].click();
                }, false);
            }


        }, reason => {
            console.log(reason)
        });

    }

    update() {
        let schedulerRoot = this.yearSchedulerRoot;
        let spinner = schedulerRoot.querySelector('.spinner-container');
        spinner.classList.remove('hide');
        let year = schedulerRoot.querySelector('.year');
        schedulerRoot.removeChild(year);
        this.yearRootContainer = document.createElement("div");
        this.yearRootContainer.classList.add("year");
        this.yearSchedulerRoot.appendChild(this.yearRootContainer);
        this.startYear();
    }

    constructor(root) {
        if (!root) return;
        this.yearSchedulerRoot = root;
        if (this.yearSchedulerRoot.parentNode.querySelector('.sliderLeftSelector') == null) {
            let leftSelector = new SelectorControls(this.yearSchedulerRoot.parentNode, 'sliderLeftSelector', this.getYears(), 'period', this.update.bind(this));
            let RightSelector = new SelectorControls(this.yearSchedulerRoot.parentNode, 'sliderRightSelector', '<span class="selector-title">All Events</span><span class="selector-content" tabindex="-1"><span class="active" w-classificationId="">All Events</span><span w-classificationId="KZFzniwnSyZfZ7v7na">Arts & Theatre</span><span w-classificationId="KZFzniwnSyZfZ7v7nn">Film</span><span w-classificationId="KZFzniwnSyZfZ7v7n1">Miscellaneous</span><span w-classificationId="KZFzniwnSyZfZ7v7nJ">Music</span><span w-classificationId="KZFzniwnSyZfZ7v7nE">Sports</span></span>', 'classificationId', this.update.bind(this));
        }
        if (this.yearSchedulerRoot.querySelector('.year') == null) {
            this.yearRootContainer = document.createElement("div");
            this.yearRootContainer.classList.add("year");
            this.yearSchedulerRoot.appendChild(this.yearRootContainer);
            this.initMessage(this.yearSchedulerRoot);
            this.startYear();
        }
    }
}

let widgetsCalendar = [];
let weekSchedulers = [];
let monthSchedulers = [];
let yearSchedulers = [];

(function () {
    let widgetContainers = document.querySelectorAll("div[w-type='calendar']");
    for (let i = 0; i < widgetContainers.length; ++i) {
        widgetsCalendar.push(new TicketmasterCalendarWidget(widgetContainers[i]));
        weekSchedulers.push(new WeekScheduler(widgetContainers[i].querySelector('.weekSсheduler')));
        monthSchedulers.push(new MonthScheduler(widgetContainers[i].querySelector('.monthScheduler')));
        yearSchedulers.push(new YearScheduler(widgetContainers[i].querySelector('.yearScheduler')));
    }

})();

let controls = new TabsControls;

if(typeof module !== "undefined") {
    module.exports = { widgetsCalendar , weekSchedulers, monthSchedulers, yearSchedulers };
}
