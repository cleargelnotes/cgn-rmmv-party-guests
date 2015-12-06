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
 * @param Show Empty Guests Window
 * @desc Shows the guest window on the default menu when no guests are in the party [Default: false]
 *
 * @help
 * Plugin Command:
 *   PartyGuests add <actorId>         # Adds the actor to the party guest list
 *   PartyGuests remove <actorId>      # Removes the actor to the party guest list
 */

(function() {
    var parameters = PluginManager.parameters('PartyGuests');
    var MAX_GUEST_COUNT = Number(parameters['Maximum Guest Count'] || 2);
    var ADD_DEFAULT_MENU_PARTY_GUEST_WINDOW = (parameters['Enable Default Menu'] || "false") == "true";
    var SHOW_GUESTS_WINDOW_WHEN_EMPTY = (parameters['Show Empty Guests Window'] || "false") == "true";
    var ADD_GUESTS_MENU_ITEM = (parameters['Add Guests to Menu'] || "false") == "true";
    
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
    // ========= BattleManager override ===========================
    var _BattleManager_makeRewards = BattleManager.makeRewards;
    BattleManager.makeRewards = function(){
        _BattleManager_makeRewards.call(this);
        
        this._rewards.guestItems = [];
        var deepthis = this;
        // check each guest
        $gameParty.partyGuests().forEach(function(guest){
            guest.guest_data.func.forEach(function(func){
                if(func.when === "end_combat" && func.func_name === "get_item"){
                    var amt = func.quantity.getNumber();
                    var rand = Math.floor(Math.random() * 100) + 1;
                    var clim = 0;
                    for(var i = 0; i < func.item_selection.length; i++){
                        var is = func.item_selection[i];
                        clim = clim + is.chance;
                        if(rand <= clim){
                            deepthis._rewards.guestItems.push({
                                item: is.item.getNumber(),
                                amt: amt,
                                creator: guest
                            });
                            break;
                        }
                    }
                }
            });
        });
    };
    
    var _BattleManager_displayRewards = BattleManager.displayRewards;
    BattleManager.displayRewards = function() {
        _BattleManager_displayRewards.call(this);
        
        this.displayGuestRecovery();
    };
    
    BattleManager.displayGuestRecovery = function(){
        $gameParty.partyGuests().forEach(function(guest){
            guest.guest_data.func.forEach(function(func){
                if(func.when === "end_combat" && func.func_name === "recover_hp"){
                    var target = func.target;
                    var percent_hp = func.percent_hp.getNumber();
                    $gameMessage.newPage();
                    $gameMessage.add(guest.name()+" "+func.action_message);
                    var msg = "";
                    var recover_targets = []
                    switch(target){
                        case "all":
                            msg = "All party members recover ";
                            recover_targets = $gameParty.members();
                            break;
                        case "lowest":
                            var lowest = -1;
                            var lowestHp = 9999999999;
                            $gameParty.members().forEach(function(member){
                                if(member.hp() < lowestHp){
                                    lowestHp = member.hp;
                                    lowest = member;
                                }
                            });
                            recover_targets.push(lowest);
                            msg = lowest.name()+" recovers ";
                            break;
                        case "highest":
                            var highest = -1;
                            var highestHp = -1;
                            $gameParty.members().forEach(function(member){
                                if(member.hp() > highestHp){
                                    highestHp = member.hp;
                                    highest = member;
                                }
                            });
                            recover_targets.push(highest);
                            msg = highest.name()+" recovers ";
                            break;
                        case "random":
                            var idx = Math.floor(Math.random()*$gameParty.size());
                            var t = $gameParty.members()[idx];
                            msg = t.name()+" recovers ";
                            recover_targets.push(t);
                            break;
                    }
                    msg = msg + "a small amount of HP!";
                    for(var i = 0; i < recover_targets.length; i++){
                        var t = recover_targets[i];
                        var to_recover = Math.ceil(t.mhp*percent_hp/100.0);
                        t.gainHp(to_recover);
                    }
                    $gameMessage.add(msg);
                }
            });
        });
    };
    
    var _BattleManager_displayDropItems = BattleManager.displayDropItems;
    BattleManager.displayDropItems = function() {
        _BattleManager_displayDropItems.call(this);
        var guest_items = this._rewards.guestItems;
        if (guest_items.length > 0) {
            $gameMessage.newPage();
            guest_items.forEach(function(drop_data) {
                var itemId = drop_data.item;
                var item = $dataItems[itemId];
                var creator = drop_data.creator;
                var amt = drop_data.amt;
                var msg = creator.name()+" found ";
                if(amt == 1){
                    msg = msg + "a";
                    if("aeiou".indexOf(item.name[0].toLowerCase()) >= 0){
                        msg = msg + "n";
                    }
                    msg = msg + " " + item.name;
                }else{
                    msg = msg + amt.toString() + " " + RUtils.getItemPluralName(item);
                }
                msg = msg + "!";
                $gameMessage.add(msg);
            });
        }
    };
    
    var _BattleManager_gainDropItems = BattleManager.gainDropItems;
    BattleManager.gainDropItems = function() {
        _BattleManager_gainDropItems.call(this);
        var items = this._rewards.guestItems;
        items.forEach(function(drop_data) {
            $gameParty.gainItem($dataItems[drop_data.item], drop_data.amt);
        });
    };
    // ========= End of BattleManager override ====================
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
    
    Game_Party.prototype.setMenuGuest = function(actor) {
        this._cgn_menuGuestId = actor.actorId();
    };
    
    Game_Party.prototype.makeMenuGuestNext = function() {
        var index = this.partyGuests().indexOf(this.menuGuest());
        if (index >= 0) {
            index = (index + 1) % this.partyGuests().length;
            this.setMenuGuest(this.partyGuests()[index]);
        }
    };
    
    Game_Party.prototype.makeMenuGuestPrevious = function() {
        var index = this.partyGuests().indexOf(this.menuGuest());
        if (index >= 0) {
            index = (index - 1 + this.partyGuests().length) % this.partyGuests().length;
            this.setMenuGuest(this.partyGuests()[index]);
        }
    };
    
    Game_Party.prototype.partyGuests = function() {
        return this._cgn_partyGuests.map(function(id) {
            return $gameActors.actor(id);
        });
    };
    
    // ============== Game Actor override =================
    
    var _Game_Actor_setup = Game_Actor.prototype.setup;
    Game_Actor.prototype.setup = function(actorId) {
        var actor = $dataActors[actorId];
        _Game_Actor_setup.call(this, actorId);
        
        this.setupGuestData(actor);
    };
    
    Game_Actor.prototype.setupGuestData = function(actorData) {
        this.guest_data = {
            skill_name: "[NO SKILL NAME]",
            description: "[NO DESCRIPTION]",
            func_code: ""
        };
        if(actorData.meta['guest_skill']){
            this.guest_data.skill_name = actorData.meta['guest_skill'];
        }
        if(actorData.meta['guest_desc']){
            this.guest_data.description = actorData.meta['guest_desc'].replace("@", "\n");
        }
        if(actorData.meta['guest_func']){
            this.guest_data.func_code = actorData.meta['guest_func'];
            this.parseGuestFuncCode();
        }
    };
    
    Game_Actor.prototype.parseGuestFuncCode = function(){
        var code = this.guest_data.func_code;
        // split first using ampersand
        var splits = code.split("&");
        
        this.guest_data.func = [];
        for(var idx=0; idx < splits.length; idx++){
            var s = splits[idx].split("|");
            var toadd = {};
            
            var when = s[0];
            toadd.when = when;
            
            var what = s[1];
            toadd.func_name = what;
            
            switch(what){
                case "get_item":
                    // get_item expects 2 args
                    // arg1 should be a number, or a range, or a set of number/ranges
                    // arg2 a set of probabilty and number range pairs
                    // e.g. 10:31-32^5:35
                    // this means 10% item 31 or 32
                    // 5% item 35
                    toadd.quantity = new RUtils.RRange(s[2]);
                    toadd.item_selection = [];
                    
                    var pairs = s[3].split("^");
                    for(var i = 0; i < pairs.length; i++){
                        var pair = pairs[i].split(":");
                        var toadd_pair = {};
                        toadd_pair.chance = parseInt(pair[0]);
                        toadd_pair.item = new RUtils.RRange(pair[1]);
                        toadd.item_selection.push(toadd_pair);
                    }
                break;
                
                case "recover_hp":
                    // recover_hp expects 3 args
                    // arg1 should be either: all, lowest, highest, random
                    // arg2 should be a number, or a range, or a set of number/ranges
                    // arg3 should be a string, which will be appended after the actor's name.
                    toadd.target = s[2];
                    toadd.percent_hp = new RUtils.RRange(s[3]);
                    toadd.action_message = s[4];
                break;
            }
            
            this.guest_data.func.push(toadd);
        }
    };
    
    Game_Actor.prototype.guestIndex = function() {
        return $gameParty.partyGuests().indexOf(this);
    };
    
    // =============== Window_GuestStatus =================
    // Full screen window of a guest's full status
    function Window_GuestStatus() {
        this.initialize.apply(this, arguments);
    }

    Window_GuestStatus.prototype = Object.create(Window_Selectable.prototype);
    Window_GuestStatus.prototype.constructor = Window_GuestStatus;

    Window_GuestStatus.prototype.initialize = function() {
        var width = Graphics.boxWidth;
        var height = Graphics.boxHeight;
        Window_Selectable.prototype.initialize.call(this, 0, 0, width, height);
        this.refresh();
        this.activate();
    };

    Window_GuestStatus.prototype.setGuest = function(guest) {
        if (this._guest !== guest) {
            this._guest = guest;
            this.refresh();
        }
    };

    Window_GuestStatus.prototype.refresh = function() {
        this.contents.clear();
        if (this._guest) {
            var lineHeight = this.lineHeight();
            this.drawBlock1(lineHeight * 0);
            this.drawHorzLine(lineHeight * 1);
            this.drawBlock2(lineHeight * 2);
            this.drawBlock3(lineHeight * 7);
            this.drawHorzLine(lineHeight * 13);
            this.drawBlock4(lineHeight * 14);
        }
    };

    Window_GuestStatus.prototype.drawBlock1 = function(y) {
        this.drawActorName(this._guest, 6, y);
        this.drawActorClass(this._guest, 192, y);
        this.drawActorNickname(this._guest, 432, y);
    };

    Window_GuestStatus.prototype.drawBlock2 = function(y) {
        this.drawActorFace(this._guest, 12, y);
    };
    
    Window_GuestStatus.prototype.drawBlock3 = function(y) {
        this.changeTextColor(this.systemColor());
        this.drawText(this._guest.guest_data.skill_name, 12, y, this.width-48);
        this.resetTextColor();
        this.drawTextEx(this._guest.guest_data.description, 12, y + this.lineHeight());
    };

    Window_GuestStatus.prototype.drawBlock4 = function(y) {
        this.drawProfile(6, y);
    };

    Window_GuestStatus.prototype.drawHorzLine = function(y) {
        var lineY = y + this.lineHeight() / 2 - 1;
        this.contents.paintOpacity = 48;
        this.contents.fillRect(0, lineY, this.contentsWidth(), 2, this.lineColor());
        this.contents.paintOpacity = 255;
    };

    Window_GuestStatus.prototype.lineColor = function() {
        return this.normalColor();
    };

    Window_GuestStatus.prototype.drawProfile = function(x, y) {
        this.drawTextEx(this._guest.profile(), x, y);
    };
    
    // =============== Scene_Guest ========================
    function Scene_Guest() {
        this.initialize.apply(this, arguments);
    }

    Scene_Guest.prototype = Object.create(Scene_MenuBase.prototype);
    Scene_Guest.prototype.constructor = Scene_Guest;

    Scene_Guest.prototype.initialize = function() {
        Scene_MenuBase.prototype.initialize.call(this);
    };

    Scene_Guest.prototype.create = function() {
        Scene_MenuBase.prototype.create.call(this);
        
        this._statusWindow = new Window_GuestStatus();
        this._statusWindow.setHandler('cancel',   this.popScene.bind(this));
        this._statusWindow.setHandler('pagedown', this.nextGuest.bind(this));
        this._statusWindow.setHandler('pageup',   this.previousGuest.bind(this));
        this.addWindow(this._statusWindow);
        this.refreshGuest();
    };
    
    Scene_Guest.prototype.updateActor = function() {
        this._guest = $gameParty.menuGuest();
    }
    
    Scene_Guest.prototype.guest = function() {
        return this._guest;
    }
    
    Scene_Guest.prototype.nextGuest = function() {
        $gameParty.makeMenuGuestNext();
        this.updateActor();
        this.onGuestChange();
    }
    
    Scene_Guest.prototype.previousGuest = function() {
        $gameParty.makeMenuGuestPrevious();
        this.updateActor();
        this.onGuestChange();
    }

    Scene_Guest.prototype.refreshGuest = function() {
        var guest = this.guest();
        this._statusWindow.setGuest(guest);
    };

    Scene_Guest.prototype.onGuestChange = function() {
        this.refreshGuest();
        this._statusWindow.activate();
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
        // ============= WINDOW MENU GUEST DEFINITION ===============
        function Window_MenuGuestStatus() {
            this.initialize.apply(this, arguments);
        }

        Window_MenuGuestStatus.prototype = Object.create(Window_Selectable.prototype);
        Window_MenuGuestStatus.prototype.constructor = Window_MenuGuestStatus;

        Window_MenuGuestStatus.prototype.initialize = function(x, y, width, height) {
            this._list = $gameParty.partyGuests();
            Window_Selectable.prototype.initialize.call(this, x, y, width, height);
            this.loadImages();
            this.refresh();
        };
        
        Window_MenuGuestStatus.prototype.loadImages = function() {
            this._list.forEach(function(actor) {
                ImageManager.loadFace(actor.faceName());
            }, this);
        };
        
        Window_MenuGuestStatus.prototype.guestHeaderText = function() {
            var guests = this._list;
            if(guests.length == 1) return "GUEST";
            return "GUESTS";
        };
        
        Window_MenuGuestStatus.prototype.refresh = function() {
            var guests = this._list;
            var x = this.textPadding();
            var width = this.contents.width - this.textPadding() * 2;
            this.contents.clear();
            
            this.changeTextColor(this.systemColor());
            this.drawText(this.guestHeaderText(), x, 0, width, 'left');
            
            this.drawAllItems();
        };
        
        Window_MenuGuestStatus.prototype.maxItems = function() {
            return this._list.length;
        };

        Window_MenuGuestStatus.prototype.itemHeight = function() {
            var guests = this._list;
            var faceHeight = (this.contents.height - this.lineHeight());
            if(guests.length > 0){
                faceHeight = faceHeight/guests.length;
            }
            return Math.floor(faceHeight);
        };
        
        Window_MenuGuestStatus.prototype.itemWidth = function() {
            return this.contents.width - this.textPadding() * 2;
        };
        
        Window_MenuGuestStatus.prototype.itemRect = function(index) {
            var rect = new Rectangle();
            var maxCols = this.maxCols();
            rect.width = this.itemWidth();
            rect.height = this.itemHeight();
            rect.x = this.textPadding();//index % maxCols * (rect.width + this.spacing()) - this._scrollX;
            rect.y = this.lineHeight() + index*rect.height;
            return rect;
        };
        
        Window_MenuGuestStatus.prototype.drawItem = function(index) {
            this.drawItemImage(index);
        };
        
        Window_MenuGuestStatus.prototype.numVisibleRows = function() {
            return this._list.length;
        };

        Window_MenuGuestStatus.prototype.drawItemImage = function(index) {
            var actor = this._list[index];
            var rect = this.itemRect(index);
            this.changePaintOpacity(true);
            this.drawActorFace(actor, rect.x + 1, rect.y + 1, rect.width, rect.height - 2);
            this.changePaintOpacity(true);
        };
        
        Window_MenuGuestStatus.prototype.selectLast = function() {
            this.select($gameParty.menuGuest().guestIndex() || 0);
        };
        
        Window_MenuGuestStatus.prototype.processOk = function() {
            $gameParty.setMenuGuest($gameParty.partyGuests()[this.index()]);
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
            this._guestWindow = new Window_MenuGuestStatus(0, this._commandWindow.height, this._goldWindow.width, guestWindowHeight);
            
            var doAdd = true;
            if(!SHOW_GUESTS_WINDOW_WHEN_EMPTY){
                if($gameParty.guestCount() == 0){
                    doAdd = false;
                }
            }
            if(doAdd){
                this.addWindow(this._guestWindow);
            }
        };
        Scene_Menu.prototype.commandGuest = function() {
            this._guestWindow.selectLast();
            this._guestWindow.activate();
            this._guestWindow.setHandler('ok',     this.onGuestOk.bind(this));
            this._guestWindow.setHandler('cancel', this.onGuestCancel.bind(this));
        };
        Scene_Menu.prototype.onGuestOk = function() {
            SceneManager.push(Scene_Guest);
        };

        Scene_Menu.prototype.onGuestCancel = function() {
            this._guestWindow.deselect();
            this._commandWindow.activate();
        };
    }
})();