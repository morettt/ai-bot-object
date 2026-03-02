/**
 * 用户核心记忆工具 - JSON 格式存储
 */
const fs = require('fs');
const path = require('path');

// JSON 文件路径
const MEMORY_FILE = path.join(process.cwd(), '用户记忆.json');

// 获取简化的日期 (只到天)
function getSimpleDate() {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const day = now.getDate();
    return `${year}年${month}月${day}日`;
}

// 读取 JSON 数据
function loadMemories() {
    try {
        if (!fs.existsSync(MEMORY_FILE)) {
            return [];
        }
        const content = fs.readFileSync(MEMORY_FILE, 'utf8');
        if (!content.trim()) {
            return [];
        }
        return JSON.parse(content);
    } catch (error) {
        console.error('读取 JSON 错误:', error);
        return [];
    }
}

// 保存 JSON 数据
function saveMemories(memories) {
    try {
        fs.writeFileSync(MEMORY_FILE, JSON.stringify(memories, null, 2), 'utf8');
        return true;
    } catch (error) {
        console.error('保存 JSON 错误:', error);
        return false;
    }
}

/**
 * 记录用户的核心记忆（个人信息、日程安排等）
 * @param {string} content - 要记录的内容
 */
async function recordMemory({content}) {
    try {
        if (!content || content.trim() === '') {
            throw new Error("记录内容不能为空");
        }

        const memories = loadMemories();

        // 生成新的 ID（最大 ID + 1）
        const newId = memories.length > 0
            ? Math.max(...memories.map(m => m.id)) + 1
            : 1;

        const newMemory = {
            id: newId,
            date: getSimpleDate(),
            content: content
        };

        memories.push(newMemory);

        if (saveMemories(memories)) {
            return `✅ 已记录 (ID: ${newId})`;
        } else {
            throw new Error("保存失败");
        }
    } catch (error) {
        console.error('保存记忆错误:', error);
        return `⚠️ 记录失败: ${error.message}`;
    }
}

/**
 * 读取用户记忆
 * @param {number} count - 读取最近的N条记录，默认读取全部
 */
async function readMemory({count = 0}) {
    try {
        const memories = loadMemories();

        if (memories.length === 0) {
            return `⚠️ 还没有任何记录`;
        }

        let result;
        if (count > 0 && count < memories.length) {
            result = memories.slice(-count);
        } else {
            result = memories;
        }

        const output = result.map(m =>
            `${m.id}. [${m.date}] ${m.content}`
        ).join('\n\n');

        return `📝 用户记忆（共 ${memories.length} 条${count > 0 ? `，显示最近 ${result.length} 条` : ''}）：\n\n${output}`;
    } catch (error) {
        console.error('读取记忆错误:', error);
        return `⚠️ 读取失败: ${error.message}`;
    }
}

/**
 * 删除指定ID的记录
 * @param {number} id - 要删除的记录ID
 */
async function deleteMemory({id}) {
    try {
        if (!id || id <= 0) {
            throw new Error("ID 必须大于 0");
        }

        const memories = loadMemories();

        if (memories.length === 0) {
            return `⚠️ 还没有任何记录`;
        }

        // 查找要删除的记录
        const index = memories.findIndex(m => m.id === id);

        if (index === -1) {
            return `⚠️ 找不到 ID 为 ${id} 的记录`;
        }

        const deletedMemory = memories[index];
        memories.splice(index, 1);

        if (saveMemories(memories)) {
            return `✅ 已删除记录 (ID: ${id})：\n[${deletedMemory.date}] ${deletedMemory.content}`;
        } else {
            throw new Error("保存失败");
        }
    } catch (error) {
        console.error('删除记忆错误:', error);
        return `⚠️ 删除失败: ${error.message}`;
    }
}

/**
 * 搜索记忆记录
 * @param {string} keyword - 搜索关键词
 */
async function searchMemory({keyword}) {
    try {
        if (!keyword || keyword.trim() === '') {
            throw new Error("关键词不能为空");
        }

        const memories = loadMemories();

        if (memories.length === 0) {
            return `⚠️ 还没有任何记录`;
        }

        const results = memories.filter(m =>
            m.content.includes(keyword) || m.date.includes(keyword)
        );

        if (results.length === 0) {
            return `⚠️ 没有找到包含 "${keyword}" 的记录`;
        }

        const output = results.map(m =>
            `${m.id}. [${m.date}] ${m.content}`
        ).join('\n\n');

        return `🔍 搜索结果（共找到 ${results.length} 条）：\n\n${output}`;
    } catch (error) {
        console.error('搜索记忆错误:', error);
        return `⚠️ 搜索失败: ${error.message}`;
    }
}

// Function Call兼容接口
function getToolDefinitions() {
    return [
        {
            name: "record_memory",
            description: "记录用户的核心记忆，包括个人信息（年龄、经历、偏好等）和日程安排（今天要做什么、明天的计划等）",
            parameters: {
                type: "object",
                properties: {
                    content: {
                        type: "string",
                        description: "要记录的内容"
                    }
                },
                required: ["content"]
            }
        },
        {
            name: "read_memory",
            description: "读取用户记忆记录，会显示带ID的列表",
            parameters: {
                type: "object",
                properties: {
                    count: {
                        type: "number",
                        description: "读取最近的N条记录，不传或传0则读取全部"
                    }
                },
                required: []
            }
        },
        {
            name: "delete_memory",
            description: "删除指定ID的记录",
            parameters: {
                type: "object",
                properties: {
                    id: {
                        type: "number",
                        description: "要删除的记录ID（从读取结果中获取）"
                    }
                },
                required: ["id"]
            }
        },
        {
            name: "search_memory",
            description: "搜索包含指定关键词的记忆记录",
            parameters: {
                type: "object",
                properties: {
                    keyword: {
                        type: "string",
                        description: "搜索关键词"
                    }
                },
                required: ["keyword"]
            }
        }
    ];
}

// Function Call兼容接口 - 执行函数
async function executeFunction(name, parameters) {
    switch (name) {
        case 'record_memory':
            return await recordMemory(parameters);
        case 'read_memory':
            return await readMemory(parameters);
        case 'delete_memory':
            return await deleteMemory(parameters);
        case 'search_memory':
            return await searchMemory(parameters);
        default:
            throw new Error(`不支持的函数: ${name}`);
    }
}

module.exports = {
    recordMemory,
    readMemory,
    deleteMemory,
    searchMemory,
    getToolDefinitions,
    executeFunction
};