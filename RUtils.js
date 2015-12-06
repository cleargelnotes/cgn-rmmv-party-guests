//=============================================================================
// RUtils.js
//=============================================================================

/*:
 * @plugindesc Utility functions and objects
 * @author Ralph Pineda (cleargelnotes)
 *
 */
 
var RUtils = RUtils || {};
RUtils.RRange = function(s) {
    this.sets = s.split(",");
    this.totalNum = 0;
    for(var i=0; i < this.sets.length; i++){
        if(this.sets[i].indexOf("-") >= 0){
            var split = this.sets[i].split("-");
            var left = parseInt(split[0]);
            var right = parseInt(split[1]);
            this.totalNum += (right-left+1);
        }else{
            this.totalNum += 1;
        }
    }
};

RUtils.RRange.prototype.getNth = function(idx) {
    if(idx >= this.totalNum || idx < 0) return parseInt(this.sets[0]);
    var cur_idx = 0;
    for(var i=0; i < this.sets.length; i++){
        var ti = this.sets[i];
        if(ti.indexOf("-") >= 0){
            var split = this.sets[i].split("-");
            var left = parseInt(split[0]);
            var right = parseInt(split[1]);
            var tn = right-left+1;
            if(idx < cur_idx + tn){
                var offset = idx-cur_idx;
                return left + offset;
            }
        }else{
            if(cur_idx == idx){
                return parseInt(ti)
            }else{
                cur_idx = cur_idx + 1;
            }
        }
    }
    return parseInt(this.sets[0]);
};

RUtils.RRange.prototype.getNumber = function() {
    var idx = Math.floor((Math.random() * this.totalNum));
    return this.getNth(idx);
};


RUtils.getItemPluralName = function(item){
    if(item.meta['plural_name']){
        return item.meta['plural_name'];
    }
    return item.name + "s";
};