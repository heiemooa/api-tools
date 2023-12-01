import NodeCache from "node-cache";

const cache = new NodeCache({
  stdTTL: 3 * 24 * 60 * 60, // 缓存默认过期时间（单位秒）
  checkperiod: 60 * 60, // 定期检查过期缓存的时间（单位秒）
});

/**
 * 从缓存中获取数据
 * @param {string} key 缓存键值
 * @return {Promise<any>} 数据
 */
export const get = async (key: string): Promise<any> => {
  return await cache.get(key);
};

/**
 * 将数据写入缓存
 * @param {string} key 缓存键值
 * @param {any} value 数据
 * @param {number} ttl 有效期，单位秒
 * @return {Promise<void>} 无返回值
 */
export const set = async (
  key: string,
  value: any,
  ttl?: number
): Promise<any> => {
  return await cache.set(key, value, ttl);
};

/**
 * 从缓存中删除数据
 * @param {string} key 缓存键值
 * @return {Promise<void>} 无返回值
 */
export const del = async (key: string) => {
  return await cache.del(key);
};
