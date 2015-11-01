//=============================================================================
// PartyGuests.js
//=============================================================================

/*:
 * @plugindesc Enables the addition of guests into the party. Guests are non-combatants that can give bonuses to the party before, during, or after battles.
 * @author Ralph Pineda (cleargelnotes)
 *
 * @help
 * Plugin Command:
 *   PartyGuests add <actorId>         # Adds the actor to the party guest list
 *   PartyGuests remove <actorId>      # Removes the actor to the party guest list
 */

(function() {
	// ========= Plugin interpreter commands setup =========
    var _Game_Interpreter_pluginCommand = Game_Interpreter.prototype.pluginCommand;
    Game_Interpreter.prototype.pluginCommand = function(command, args) {
        _Game_Interpreter_pluginCommand.call(this, command, args);
        if (command === 'PartyGuests') {
            switch (args[0]) {
				case 'add':
					$gameSystem.addToPartyGuests(Number(args[1]));
					break;
				case 'remove':
					$gameSystem.removeFromPartyGuests(Number(args[1]));
					break;
            }
        }
    };
	
	// ========= Game_System extra functions =========
	Game_System.prototype.addToPartyGuests = function(actorId) {
        $gameParty._cgn_addGuest(actorId);
    };

    Game_System.prototype.removeFromPartyGuests = function(actorId) {
        $gameParty._cgn_removeGuest(actorId);
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
			this._cgn_partyGuests.push(actorId);
			$gamePlayer.refresh();
			$gameMap.requestRefresh();
		}
	};
	
	Game_Party.prototype._cgn_removeGuest = function(actorId){
		if (this._cgn_partyGuests.contains(actorId)){
			this._cgn_partyGuests.splice(this._cgn_partyGuests.indexOf(actorId), 1);
			$gamePlayer.refresh();
			$gameMap.requestRefresh();
		}
	};
})();