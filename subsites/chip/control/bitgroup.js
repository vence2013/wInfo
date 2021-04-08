exports.edit = async (ctx, registerid, bitsid, name, fullname, rw, desc, bitlist, valuelist)=>{
    const ChipRegister = ctx.models['ChipRegister'];
    const ChipBitgroup = ctx.models['ChipBitgroup'];
    
    if (bitsid) {
        var bitsIns = await ChipBitgroup.findOne({logging:false, where:{'id':bitsid}});
        if (!bitsIns) return -1;

        await bitsIns.update({'name':name, 'fullname':fullname, 'rw':rw, 'desc':desc, 
            'bitlist':bitlist, 'valuelist':valuelist}, {logging:false});
        return 0;
    } else {
        var registerIns = await ChipRegister.findOne({logging:false, where:{'id':registerid}});
        if (!registerIns) return -2;

        var [bitIns, created] = await ChipBitgroup.findOrCreate({logging:false, 
            where:{'name':name, 'ChipRegisterId':registerid}, 
            defaults:{'rw':rw, 'bitlist':bitlist, 'valuelist':valuelist, 'fullname':fullname, 'desc':desc}
        });
        return created ? 0 : -3;
    }
}

exports.delete = async (ctx, bitsid)=>{
    const ChipBitgroup = ctx.models['ChipBitgroup'];

    await ChipBitgroup.destroy({logging: false, where: {'id': bitsid}});
}

exports.list = async (ctx, registerid)=>{
    const ChipBitgroup = ctx.models['ChipBitgroup'];

    var ret = await ChipBitgroup.findAll({logging: false, raw: true, where: {'ChipRegisterId': registerid}});
    var bitslist = ret.map((x)=>{
        if (x['desc'])
            x['desc'] = x['desc'].toString();
        return x;
    });
    return bitslist;
}

exports.detail = async (ctx, bitsid)=>{
    const ChipBitgroup = ctx.models['ChipBitgroup'];

    var ret = await ChipBitgroup.findOne({logging: false, raw: true, where: {'id': bitsid}});
    ret['desc'] = ret['desc'].toString();
    return ret;
}