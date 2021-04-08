exports.edit = async (ctx, chipid, moduleid, name, fullname)=>{
    const Chip = ctx.models['Chip'];
    const ChipModule = ctx.models['ChipModule'];

    if (moduleid) {
        var moduleIns = await ChipModule.findOne({logging:false, where:{'id':moduleid}});
        if (!moduleIns) return -1;

        await moduleIns.update({'name':name, 'fullname':fullname}, {logging:false});
        return 0;
    } else {
        var chipIns = await Chip.findOne({logging:false, where:{'id':chipid}});
        if (!chipIns) return -2;

        var [moduleIns, created] = await ChipModule.findOrCreate({logging:false, 
            where:{'name':name, 'ChipId':chipid}, defaults:{'fullname':fullname}
        });
        return created ? 0 : -3;
    }    
}

exports.delete = async (ctx, moduleid)=>{
    const ChipModule = ctx.models['ChipModule'];

    await ChipModule.destroy({logging: false, where: {'id': moduleid}});
}

exports.list = async (ctx, chipid)=>{
    const ChipModule = ctx.models['ChipModule'];

    return await ChipModule.findAll({logging: false, raw: true, where: {'ChipId': chipid}});
}

exports.detail = async (ctx, moduleid)=>{
    const ChipModule = ctx.models['ChipModule'];

    return await ChipModule.findOne({logging: false, raw: true, where: {'id': moduleid}});
}