exports.edit = async (ctx, chipid, name, width)=>{
    const Chip = ctx.models['Chip'];
    
    if (!chipid) {
        var [chipIns, created] = await Chip.findOrCreate({logging:false, 
            where: {'name':name, 'width':width}
        });
        return created ? 0 : -1;
    } else {
        var chipIns = await Chip.findOne({logging:false, where:{'id':chipid}});
        if (!chipIns) return -1;

        await chipIns.update({'name':name, 'width':width}, {logging:false});
    }
    return 0;
}

exports.delete = async (ctx, chipid)=>{
    const Chip = ctx.models['Chip'];

    await Chip.destroy({logging: false, where: {'id': chipid}});
}

exports.get = async (ctx)=>{
    const Chip = ctx.models['Chip'];

    return await Chip.findAll({logging: false, raw: true});
}