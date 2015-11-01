//=============================================================================
// PartyGuests.js
//=============================================================================

/*:
 * @plugindesc Enables the addition of guests into the party. Guests are non-combatants that can give bonuses to the party before, during, or after battles.
 * @author Ralph Pineda (cleargelnotes)
 *
 * @help This plugin does not provide plugin commands.
 */

(function() {
	var _Game_Party_initialize = Game_Party.prototype.initialize;
	
	Game_Party.prototype.initialize = function() {
		_Game_Party_initialize.call(this, arguments);
		this._cgn_initGuests();
	}
	
	Game_Party.prototype._cgn_initGuests = function() {
		this._cgn_partyGuests = [];
	}
	
	Game_Party.prototype._cgn_addGuest = function(actorId) {
		// if this actor is in the active party, and is not alone, remove from party first
		if (this._actors.contains(actorId))) {
			if (this._actors.length > 1){
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
	}
	
	Game_Party.prototype._cgn_removeGuest = function(actorId){
		if (!this._cgn_partyGuests.contains(actorId)){
			this._cgn_partyGuests.splice(this._cgn_partyGuests.indexOf(actorId), 1);
			$gamePlayer.refresh();
			$gameMap.requestRefresh();
		}
	}
})();
