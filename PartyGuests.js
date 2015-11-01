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
    
    Game_Party.prototype.partyGuests = function() {
        return this._cgn_partyGuests.map(function(id) {
            return $gameActors.actor(id);
        });
    };
    
    // ============= default menu setup ==================
    if(ADD_DEFAULT_MENU_PARTY_GUEST_WINDOW) {
        // ============= WINDOW GUEST DEFINITION ===============
        function Window_GuestStatus() {
            this.initialize.apply(this, arguments);
        }

        Window_GuestStatus.prototype = Object.create(Window_Base.prototype);
        Window_GuestStatus.prototype.constructor = Window_GuestStatus;

        Window_GuestStatus.prototype.initialize = function(x, y, width, height) {
            Window_Base.prototype.initialize.call(this, x, y, width, height);
            this.refresh();
        };
        
        Window_GuestStatus.prototype.guestHeaderText = function() {
            var guests = $gameParty.partyGuests();
            if(guests.length == 1) return "GUEST";
            return "GUESTS";
        };
        
        Window_GuestStatus.prototype.refresh = function() {
            var guests = $gameParty.partyGuests();
            var x = this.textPadding();
            var width = this.contents.width - this.textPadding() * 2;
            this.contents.clear();
            
            this.changeTextColor(this.systemColor());
            this.drawText(this.guestHeaderText(), x, 0, width, 'left');
            
            // next, draw the faces
            var faceHeight = (this.contents.height - this.lineHeight());
            if(guests.length > 0){
                faceHeight = faceHeight/guests.length;
            }
            for (var i = 0; i < guests.length; i++) {
                var guest = guests[i];
                var y = this.lineHeight() + i*faceHeight;
                this.drawActorFace(guest, x, y, width, faceHeight);
            }
        };

        Window_GuestStatus.prototype.open = function() {
            this.refresh();
            Window_Base.prototype.open.call(this);
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
    }
})();