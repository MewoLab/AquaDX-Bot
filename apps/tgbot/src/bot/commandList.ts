const commandListBase = [
	{ command: 'search', description: '搜索 Maimai DX 歌曲信息' },
	{ command: 'chuni', description: '搜索中二节奏歌曲信息' },
	{ command: 'b50', description: '生成 Maimai DX B50 成绩图' },
	{ command: 'query', description: '查询自己 Maimai DX 某首歌的成绩' },
	{ command: 'help', description: '查看一些帮助信息' }
] as const;

export const commandListGroup = [...commandListBase] as const;

export const commandListPrivate = [
	{ command: 'bind', description: '绑定账号' },
	{ command: 'profile', description: '查看自己绑定的账号' },
	{ command: 'delprofile', description: '删除绑定的账号' },
	{ command: 'export', description: '导出当前账号的成绩列表（国服 / 国际服）' },
	...commandListBase
] as const;

export const commandListAdmin = [
	...commandListPrivate,
	{ command: 'ban', description: '在排行榜中封禁用户' },
	{ command: 'set_my_command', description: '更新 Bot 命令列表' },
	{ command: 'debug_net_card', description: '调试 Net 用户资料，参数：卡号' },
	// { command: 'stats', description: '统计信息' }
] as const;
