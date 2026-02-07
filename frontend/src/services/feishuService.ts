// 飞书服务相关API

/**
 * 飞书服务类，提供飞书相关的工具函数
 */
class FeishuService {
  /**
   * 生成飞书多维表格的访问链接
   * @param sheetId 多维表格ID
   * @returns 完整的飞书多维表格访问链接
   */
  static getSheetUrl(sheetId: string): string {
    return `https://feishu.cn/sheets/${sheetId}`;
  }

  /**
   * 生成飞书文档的访问链接
   * @param docId 文档ID
   * @returns 完整的飞书文档访问链接
   */
  static getDocUrl(docId: string): string {
    return `https://feishu.cn/docx/${docId}`;
  }

  /**
   * 生成飞书日历的访问链接
   * @returns 飞书日历访问链接
   */
  static getCalendarUrl(): string {
    return 'https://feishu.cn/calendar';
  }

  /**
   * 生成飞书审批的访问链接
   * @returns 飞书审批访问链接
   */
  static getApprovalUrl(): string {
    return 'https://feishu.cn/approval';
  }

  /**
   * 生成飞书设置页的访问链接
   * @returns 飞书设置页访问链接
   */
  static getSettingsUrl(): string {
    return 'https://feishu.cn/settings';
  }

  /**
   * 生成飞书工作台的访问链接
   * @returns 飞书工作台访问链接
   */
  static getWorkspaceUrl(): string {
    return 'https://feishu.cn/workplace';
  }

  /**
   * 生成飞书用户中心的访问链接
   * @returns 飞书用户中心访问链接
   */
  static getUserCenterUrl(): string {
    return 'https://feishu.cn/profile';
  }

  /**
   * 生成飞书应用商店的访问链接
   * @returns 飞书应用商店访问链接
   */
  static getAppStoreUrl(): string {
    return 'https://feishu.cn/apps';
  }

  /**
   * 从URL中提取飞书文档/表格的ID
   * @param url 飞书文档/表格的完整URL
   * @returns 提取的文档/表格ID
   */
  static extractIdFromUrl(url: string): string | null {
    // 匹配飞书表格URL：https://feishu.cn/sheets/xxxx
    const sheetMatch = url.match(/\/sheets\/(\w+)/);
    if (sheetMatch && sheetMatch[1]) {
      return sheetMatch[1];
    }

    // 匹配飞书文档URL：https://feishu.cn/docx/xxxx
    const docMatch = url.match(/\/docx\/(\w+)/);
    if (docMatch && docMatch[1]) {
      return docMatch[1];
    }

    return null;
  }

  /**
   * 检查URL是否为飞书相关链接
   * @param url 要检查的URL
   * @returns 是否为飞书链接
   */
  static isFeishuUrl(url: string): boolean {
    return url.includes('feishu.cn') || url.includes('larksuite.com');
  }

  /**
   * 检查URL是否为飞书多维表格链接
   * @param url 要检查的URL
   * @returns 是否为飞书多维表格链接
   */
  static isFeishuSheetUrl(url: string): boolean {
    return url.includes('feishu.cn/sheets') || url.includes('larksuite.com/sheets');
  }

  /**
   * 检查URL是否为飞书文档链接
   * @param url 要检查的URL
   * @returns 是否为飞书文档链接
   */
  static isFeishuDocUrl(url: string): boolean {
    return url.includes('feishu.cn/docx') || url.includes('larksuite.com/docx');
  }
}

export default FeishuService;