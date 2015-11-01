//=============================================================================
// PartyGuests.js
//=============================================================================

/*:
 * @plugindesc Enables the addition of guests into the party. Guests are non-combatants that can give bonuses to the party before, during, or after battles.
 * @author Ralph Pineda (cleargelnotes)
 * @param Maximum Guest Count
 * @desc Maximum number of guests [Default: 2]
 * @param Enable Default Menu
 * @desc Adds the guest window on the default menu (works only if you are using the default menu!) [Default: false]
 * @param Add Guests to Menu
 * @desc Adds the Guests item into the menu selection [Default: false]
 *
 * @help
 * Plugin Command:
 *   PartyGuests add <actorId>         # Adds the actor to the party guest list
 *   PartyGuests remove <actorId>      # Removes the actor to the party guest list
 */

(function() {
    var parameters = PluginManager.parameters('PartyGuests');
    var MAX_GUEST_COUNT = Number(parameters['Maximum Guest Count'] || 2);
    var ADD_DEFAULT_MENU_PARTY_GUEST_WINDOW = Boolean(parameters['Enable Default Menu'] || false);
    var ADD_GUESTS_MENU_ITEM = Boolean(parameters['Add Guests to Menu'] || false);
    
    // ========= Plugin interpreter commands setup =========
    var _Game_Interpreter_pluginCommand = Game_Interpreter.prototype.pluginCommand;
    Game_Interpreter.prototype.pluginCommand = function(command, args) {
        _Game_Interpreter_pluginCommand.call(this, command, args);
        if (command === 'PartyGuests') {
            switch (args[0]) {
                case 'add':
                    $gameParty.addToPartyGuests(Number(args[1]));
                    break;
                case 'remove':
                    $gameParty.removeFromPartyGuests(Number(args[1]));
                    break;
            }
        }
    };
    
    // ========= End of Plugin interpreter commands setup =========
    
    var _Game_Party_initialize = Game_Party.prototype.initialize;
    
    Game_Party.prototype.initialize = function() {
        _Game_Party_initialize.call(this, arguments);
        this._cgn_initGuests();
    };
    
    Game_Party.prototype._cgn_initGuests = function() {
        this._cgn_partyGuests = [];
        this._cgn_menuGuestId = -1;
    };
    
    Game_Party.prototype._cgn_addGuest = function(actorId) {
        // if this actor is in the active party, and is not alone, remove from party first
        if (this._actors.contains(actorId)) {
            if (this.size() > 1){
                this.removeActor(actorId);
            }else{
                // TODO: alert the user or something
                return;
            }
        }
        
        if (!this._cgn_partyGuests.contains(actorId)){
            if(this.guestCount() >= MAX_GUEST_COUNT){
                // TODO: alert that max guests has been reached
            }else{                
                this._cgn_partyGuests.push(actorId);
                $gamePlayer.refresh();
                $gameMap.requestRefresh();
            }
        }
    };
    
    Game_Party.prototype._cgn_removeGuest = function(actorId){
        if (this._cgn_partyGuests.contains(actorId)){
            this._cgn_partyGuests.splice(this._cgn_partyGuests.indexOf(actorId), 1);
            if(actorId == this._cgn_menuGuestId){
                this._cgn_menuGuestId = -1;
            }
            $gamePlayer.refresh();
            $gameMap.requestRefresh();
        }
    };
    
    // ============ publicly visible functions =============
    Game_Party.prototype.addToPartyGuests = function(actorId) {
        $gameParty._cgn_addGuest(actorId);
    };

    Game_Party.prototype.removeFromPartyGuests = function(actorId) {
        $gameParty._cgn_removeGuest(actorId);
    };
    
    Game_Party.prototype.hasPartyGuest = function(actorId) {
        return this._cgn_partyGuests.contains(actorId);
    };
    
    Game_Party.prototype.guestCount = function() {
        return this._cgn_partyGuests.length;
    };
    
    Game_Party.prototype.menuGuest = function() {
        if(this._cgn_menuGuestId < 0){
            return this.partyGuests()[0];
        }
        var actor = $gameActors.actor(this._cgn_menuGuestId);
        return actor;
    };
    
    Game_Party.prototype.setMenuGuest = function(actorId) {
        this._cgn_menuGuestId = actorId;
    };
    
    Game_Party.prototype.partyGuests = function() {
        return this._cgn_partyGuests.map(function(id) {
            return $gameActors.actor(id);
        });
    };
    
    // ============== Game Actor override =================
    
    Game_Actor.prototype.guestIndex = function() {
        return $gameParty.partyGuests().indexOf(this);
    };
    
    // ============= default menu setup ==================
    if(ADD_GUESTS_MENU_ITEM){
        var _Window_MenuCommand_addOriginalCommands = Window_MenuCommand.prototype.addOriginalCommands;
        Window_MenuCommand.prototype.addOriginalCommands = function() {
            _Window_MenuCommand_addOriginalCommands.call(this);
            var enabled = ($gameParty.guestCount() > 0);
            this.addCommand("Guests", "guests", enabled);
        };
        
        var _Scene_Menu_createCommandWindow = Scene_Menu.prototype.createCommandWindow;        
        Scene_Menu.prototype.createCommandWindow = function() {
            _Scene_Menu_createCommandWindow.call(this);
            this._commandWindow.setHandler('guests', this.commandGuest.bind(this));
        };
        
        Scene_Menu.prototype.commandGuest = function() {
            // TODO: do nothing. STUB!
        };
    }
    
    if(ADD_DEFAULT_MENU_PARTY_GUEST_WINDOW) {
        // ============= WINDOW GUEST DEFINITION ===============
        function Window_GuestStatus() {
            this.initialize.apply(this, arguments);
        }

        Window_GuestStatus.prototype = Object.create(Window_Selectable.prototype);
        Window_GuestStatus.prototype.constructor = Window_GuestStatus;

        Window_GuestStatus.prototype.initialize = function(x, y, width, height) {
            this._list = $gameParty.partyGuests();
            Window_Selectable.prototype.initialize.call(this, x, y, width, height);
            this.loadImages();
            this.refresh();
        };
        
        Window_GuestStatus.prototype.loadImages = function() {
            this._list.forEach(function(actor) {
                ImageManager.loadFace(actor.faceName());
            }, this);
        };
        
        Window_GuestStatus.prototype.guestHeaderText = function() {
            var guests = this._list;
            if(guests.length == 1) return "GUEST";
            return "GUESTS";
        };
        
        Window_GuestStatus.prototype.refresh = function() {
            var guests = this._list;
            var x = this.textPadding();
            var width = this.contents.width - this.textPadding() * 2;
            this.contents.clear();
            
            this.changeTextColor(this.systemColor());
            this.drawText(this.guestHeaderText(), x, 0, width, 'left');
            
            this.drawAllItems();
        };
        
        Window_GuestStatus.prototype.maxItems = function() {
            return this._list.length;
        };

        Window_GuestStatus.prototype.itemHeight = function() {
            var guests = this._list;
            var faceHeight = (this.contents.height - this.lineHeight());
            if(guests.length > 0){
                faceHeight = faceHeight/guests.length;
            }
            return Math.floor(faceHeight);
        };
        
        Window_GuestStatus.prototype.itemWidth = function() {
            return this.contents.width - this.textPadding() * 2;
        };
        
        Window_GuestStatus.prototype.itemRect = function(index) {
            var rect = new Rectangle();
            var maxCols = this.maxCols();
            rect.width = this.itemWidth();
            rect.height = this.itemHeight();
            rect.x = this.textPadding();//index % maxCols * (rect.width + this.spacing()) - this._scrollX;
            rect.y = this.lineHeight() + index*rect.height;
            return rect;
        };
        
        Window_GuestStatus.prototype.drawItem = function(index) {
            this.drawItemImage(index);
        };
        
        Window_GuestStatus.prototype.numVisibleRows = function() {
            return this._list.length;
        };

        Window_GuestStatus.prototype.drawItemImage = function(index) {
            var actor = this._list[index];
            var rect = this.itemRect(index);
            this.changePaintOpacity(true);
            this.drawActorFace(actor, rect.x + 1, rect.y + 1, rect.width, rect.height - 2);
            this.changePaintOpacity(true);
        };
        
        Window_GuestStatus.prototype.selectLast = function() {
            this.select($gameParty.menuGuest().guestIndex() || 0);
        };
        
        Window_GuestStatus.prototype.processOk = function() {
            $gameParty.setMenuGuest($gameParty._cgn_partyGuests[this.index()]);
            Window_Selectable.prototype.processOk.call(this);
        };
        // ============= END OF WINDOW GUEST DEFINITION ===============
        var _Scene_Menu_create = Scene_Menu.prototype.create;
        Scene_Menu.prototype.create = function() {
            _Scene_Menu_create.call(this);
            this.createGuestWindow();
        };
        Scene_Menu.prototype.createGuestWindow = function() {
            var guestWindowHeight = Graphics.boxHeight - this._goldWindow.height - this._commandWindow.height;
            this._guestWindow = new Window_GuestStatus(0, this._commandWindow.height, this._goldWindow.width, guestWindowHeight);
            this.addWindow(this._guestWindow);
        };
        Scene_Menu.prototype.commandGuest = function() {
            this._guestWindow.selectLast();
            this._guestWindow.activate();
            this._guestWindow.setHandler('ok',     this.onGuestOk.bind(this));
            this._guestWindow.setHandler('cancel', this.onGuestCancel.bind(this));
        };
        Scene_Menu.prototype.onGuestOk = function() {
            // TODO: MAKE Scene_Guest
            this._guestWindow.deselect();
            this._commandWindow.activate();
        };

        Scene_Menu.prototype.onGuestCancel = function() {
            this._guestWindow.deselect();
            this._commandWindow.activate();
        };
    }
})();