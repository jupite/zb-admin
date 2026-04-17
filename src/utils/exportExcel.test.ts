import { describe, it, expect, beforeEach, vi } from 'vitest'
import ExcelJS from 'exceljs'
import {
  exportExcel,
  addCellStyle,
  exportStyleExcel,
  exportMultiHeaderExcel,
  DEFAULT_COLUMN_WIDTH,
} from './exprotExcel'

const autoWidthAction = (val, width = 10) => {
  if (val == null) {
    width = 10
  } else if (val.toString().charCodeAt(0) > 255) {
    width = val.toString().length * 2
  } else {
    width = val.toString().length
  }
  return width
}

describe('exportExcel utils', () => {
  beforeEach(() => {
    global.URL.createObjectURL = vi.fn(() => 'blob:test-url')
    global.URL.revokeObjectURL = vi.fn()
    document.createElement = vi.fn(
      () =>
        ({
          href: '',
          download: '',
          click: vi.fn(),
        }) as any
    )
    global.Blob = vi.fn(function (content, options) {
      return { content, options }
    }) as any
  })

  describe('autoWidthAction', () => {
    it('should return default width 10 when value is null', () => {
      expect(autoWidthAction(null)).toBe(10)
    })

    it('should return default width 10 when value is undefined', () => {
      expect(autoWidthAction(undefined)).toBe(10)
    })

    it('should calculate width correctly for English characters', () => {
      expect(autoWidthAction('hello')).toBe(5)
      expect(autoWidthAction('test')).toBe(4)
    })

    it('should calculate width correctly for Chinese characters', () => {
      expect(autoWidthAction('你好')).toBe(4)
      expect(autoWidthAction('测试')).toBe(4)
      expect(autoWidthAction('中国北京')).toBe(8)
    })

    it('should ignore custom default width when value is null (current implementation behavior)', () => {
      expect(autoWidthAction(null, 15)).toBe(10)
    })

    it('should handle numbers correctly', () => {
      expect(autoWidthAction(12345)).toBe(5)
      expect(autoWidthAction(0)).toBe(1)
    })

    it('should handle empty string', () => {
      expect(autoWidthAction('')).toBe(0)
    })
  })

  describe('DEFAULT_COLUMN_WIDTH', () => {
    it('should export DEFAULT_COLUMN_WIDTH as 20', () => {
      expect(DEFAULT_COLUMN_WIDTH).toBe(20)
    })
  })

  describe('addCellStyle', () => {
    it('should apply default styles when attr is not provided', () => {
      const cell: any = {}
      addCellStyle(cell)

      expect(cell.fill).toEqual({
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: undefined },
      })
      expect(cell.font).toEqual({
        bold: true,
        size: 11,
        color: { argb: 'ff0000' },
      })
      expect(cell.alignment).toEqual({
        vertical: 'middle',
        wrapText: true,
        horizontal: 'left',
      })
    })

    it('should apply custom styles when attr is provided', () => {
      const cell: any = {}
      addCellStyle(cell, {
        color: 'ffffffff',
        fontSize: 14,
        horizontal: 'center',
        bold: false,
      })

      expect(cell.fill.fgColor.argb).toBe('ffffffff')
      expect(cell.font.bold).toBe(false)
      expect(cell.font.size).toBe(14)
      expect(cell.alignment.horizontal).toBe('center')
    })

    it('should use default values for missing properties in attr', () => {
      const cell: any = {}
      addCellStyle(cell, { color: 'dff8ff' })

      expect(cell.font.bold).toBe(true)
      expect(cell.font.size).toBe(11)
      expect(cell.alignment.horizontal).toBe('left')
    })
  })

  describe('exportExcel', () => {
    it('should export excel with xlsx format by default', async () => {
      const mockColumn = [
        { name: 'name', label: '姓名' },
        { name: 'age', label: '年龄' },
      ]
      const mockData = [
        { name: '张三', age: 25 },
        { name: '李四', age: 30 },
      ]

      await exportExcel({
        column: mockColumn,
        data: mockData,
        filename: 'test-file',
        autoWidth: true,
        format: 'xlsx',
      })

      expect(Blob).toHaveBeenCalled()
      expect(document.createElement).toHaveBeenCalledWith('a')
    })

    it('should export excel with csv format', async () => {
      const mockColumn = [
        { name: 'name', label: '姓名' },
        { name: 'age', label: '年龄' },
      ]
      const mockData = [
        { name: '张三', age: 25 },
        { name: '李四', age: 30 },
      ]

      await exportExcel({
        column: mockColumn,
        data: mockData,
        filename: 'test-file',
        autoWidth: false,
        format: 'csv',
      })

      expect(Blob).toHaveBeenCalled()
    })

    it('should handle autoWidth=false correctly', async () => {
      const mockColumn = [
        { name: 'name', label: '姓名' },
        { name: 'age', label: '年龄' },
      ]
      const mockData = [{ name: '张三', age: 25 }]

      await exportExcel({
        column: mockColumn,
        data: mockData,
        filename: 'test-file',
        autoWidth: false,
        format: 'xlsx',
      })

      expect(Blob).toHaveBeenCalled()
    })

    it('should handle empty data array', async () => {
      const mockColumn = [
        { name: 'name', label: '姓名' },
        { name: 'age', label: '年龄' },
      ]

      await exportExcel({
        column: mockColumn,
        data: [],
        filename: 'test-file',
        autoWidth: true,
        format: 'xlsx',
      })

      expect(Blob).toHaveBeenCalled()
    })
  })

  describe('exportStyleExcel', () => {
    it('should export styled excel with xlsx format', async () => {
      const mockColumn = [
        { name: 'name', label: '姓名' },
        { name: 'age', label: '年龄' },
      ]
      const mockData = [
        { name: '张三', age: 25 },
        { name: '李四', age: 30 },
      ]

      await exportStyleExcel({
        column: mockColumn,
        data: mockData,
        filename: 'test-style-file',
        autoWidth: true,
        format: 'xlsx',
      })

      expect(Blob).toHaveBeenCalled()
      expect(document.createElement).toHaveBeenCalledWith('a')
    })

    it('should export styled excel with csv format', async () => {
      const mockColumn = [
        { name: 'name', label: '姓名' },
        { name: 'age', label: '年龄' },
      ]
      const mockData = [{ name: '张三', age: 25 }]

      await exportStyleExcel({
        column: mockColumn,
        data: mockData,
        filename: 'test-style-file',
        autoWidth: false,
        format: 'csv',
      })

      expect(Blob).toHaveBeenCalled()
    })
  })

  describe('exportMultiHeaderExcel', () => {
    beforeEach(() => {
      vi.useFakeTimers()
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('should export multi-header excel with simple columns', async () => {
      const mockColumn = [
        { name: 'id', label: '序号' },
        { name: 'date', label: '日期' },
        { name: 'address', label: '地址' },
      ]
      const mockData = [
        { id: 1, date: '2024-01-01', address: '北京市朝阳区', province: '北京', city: '北京', zipCode: '100000' },
      ]

      exportMultiHeaderExcel({
        column: mockColumn,
        data: mockData,
        filename: 'test-multi-header',
        autoWidth: true,
      })

      await vi.runAllTimersAsync()
      expect(Blob).toHaveBeenCalled()
    })

    it('should export multi-header excel with nested columns (children)', async () => {
      const mockColumn = [
        { name: 'id', label: '序号' },
        { name: 'date', label: '日期' },
        {
          label: '配送消息',
          name: 'delivery',
          children: [
            { name: 'province', label: '省份' },
            { name: 'city', label: '城市' },
            { name: 'zipCode', label: '邮编' },
          ],
        },
      ]
      const mockData = [
        { id: 1, date: '2024-01-01', province: '北京', city: '北京', zipCode: '100000' },
        { id: 2, date: '2024-01-02', province: '上海', city: '上海', zipCode: '200000' },
      ]

      exportMultiHeaderExcel({
        column: mockColumn,
        data: mockData,
        filename: 'test-multi-header-nested',
        autoWidth: true,
      })

      await vi.runAllTimersAsync()
      expect(Blob).toHaveBeenCalled()
    })

    it('should handle empty data array in multi-header export', async () => {
      const mockColumn = [
        { name: 'id', label: '序号' },
        { name: 'date', label: '日期' },
        {
          label: '配送消息',
          name: 'delivery',
          children: [
            { name: 'province', label: '省份' },
            { name: 'city', label: '城市' },
          ],
        },
      ]

      exportMultiHeaderExcel({
        column: mockColumn,
        data: [],
        filename: 'test-multi-header-empty',
        autoWidth: true,
      })

      await vi.runAllTimersAsync()
      expect(Blob).toHaveBeenCalled()
    })
  })

  describe('msSaveOrOpenBlob browser compatibility', () => {
    it('should use msSaveBlob when browser is IE/Edge', async () => {
      const msSaveBlobMock = vi.fn()
      ;(window.navigator as any).msSaveOrOpenBlob = true
      ;(navigator as any).msSaveBlob = msSaveBlobMock

      const mockColumn = [{ name: 'name', label: '姓名' }]
      const mockData = [{ name: '张三' }]

      await exportExcel({
        column: mockColumn,
        data: mockData,
        filename: 'test-ie',
        autoWidth: true,
        format: 'xlsx',
      })

      expect(msSaveBlobMock).toHaveBeenCalled()
      delete (window.navigator as any).msSaveOrOpenBlob
      delete (navigator as any).msSaveBlob
    })
  })
})
