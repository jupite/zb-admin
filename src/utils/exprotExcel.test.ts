import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { exportExcel, addCellStyle, exportStyleExcel, exportMultiHeaderExcel, DEFAULT_COLUMN_WIDTH } from './exprotExcel'

// Mock ExcelJS
const mockCell = {
  fill: {},
  font: {},
  alignment: {},
}

const mockRow = {
  values: [],
  number: 1,
  eachCell: vi.fn((callback) => {
    callback(mockCell)
  }),
  getCell: vi.fn(() => mockCell),
}

const mockWorksheet = {
  columns: [],
  addRows: vi.fn(),
  getRow: vi.fn(() => mockRow),
  mergeCells: vi.fn(),
}

const mockWorkbook = {
  creator: '',
  title: '',
  created: null,
  modified: null,
  addWorksheet: vi.fn(() => mockWorksheet),
  xlsx: {
    writeBuffer: vi.fn().mockResolvedValue(new Uint8Array([1, 2, 3])),
  },
  csv: {
    writeBuffer: vi.fn().mockResolvedValue(new Uint8Array([4, 5, 6])),
  },
}

vi.mock('exceljs', () => {
  return {
    default: {
      Workbook: vi.fn(() => mockWorkbook),
    },
  }
})

describe('exprotExcel', () => {
  let mockCreateElement
  let mockCreateObjectURL
  let mockRevokeObjectURL
  let mockClick
  let mockMsSaveBlob
  let mockMsSaveOrOpenBlob

  beforeEach(() => {
    // Mock DOM APIs
    mockCreateElement = vi.fn(() => ({
      href: '',
      download: '',
      click: vi.fn(),
    }))
    mockCreateObjectURL = vi.fn(() => 'blob:url')
    mockRevokeObjectURL = vi.fn()
    mockClick = vi.fn()
    mockMsSaveBlob = vi.fn()
    mockMsSaveOrOpenBlob = { msSaveBlob: mockMsSaveBlob }

    global.document.createElement = mockCreateElement
    global.window.URL.createObjectURL = mockCreateObjectURL
    global.window.URL.revokeObjectURL = mockRevokeObjectURL
    global.window.navigator.msSaveOrOpenBlob = undefined
    global.navigator.msSaveBlob = undefined

    // Reset mock state
    mockWorkbook.addWorksheet.mockClear()
    mockWorkbook.xlsx.writeBuffer.mockClear()
    mockWorkbook.csv.writeBuffer.mockClear()
    mockWorksheet.addRows.mockClear()
    mockWorksheet.getRow.mockClear()
    mockWorksheet.mergeCells.mockClear()
    mockRow.eachCell.mockClear()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('exportExcel', () => {
    it('should export Excel with xlsx format', async () => {
      const params = {
        column: [
          { label: '姓名', name: 'name' },
          { label: '年龄', name: 'age' },
        ],
        data: [
          { name: '张三', age: 20 },
          { name: '李四', age: 25 },
        ],
        filename: 'test',
        autoWidth: true,
        format: 'xlsx',
      }

      await exportExcel(params)

      expect(mockCreateElement).toHaveBeenCalledWith('a')
      expect(mockCreateObjectURL).toHaveBeenCalled()
    })

    it('should export Excel with csv format', async () => {
      const params = {
        column: [{ label: '姓名', name: 'name' }],
        data: [{ name: '张三' }],
        filename: 'test',
        autoWidth: false,
        format: 'csv',
      }

      await exportExcel(params)

      expect(mockCreateElement).toHaveBeenCalledWith('a')
    })

    it('should handle IE browser download', async () => {
      global.window.navigator.msSaveOrOpenBlob = mockMsSaveOrOpenBlob
      global.navigator.msSaveBlob = mockMsSaveBlob

      const params = {
        column: [{ label: '姓名', name: 'name' }],
        data: [{ name: '张三' }],
        filename: 'test',
        autoWidth: false,
        format: 'xlsx',
      }

      await exportExcel(params)

      expect(mockMsSaveBlob).toHaveBeenCalled()
    })

    it('should handle empty data', async () => {
      const params = {
        column: [{ label: '姓名', name: 'name' }],
        data: [],
        filename: 'test',
        autoWidth: true,
        format: 'xlsx',
      }

      await exportExcel(params)

      expect(mockCreateElement).toHaveBeenCalledWith('a')
    })

    it('should handle null values in data', async () => {
      const params = {
        column: [{ label: '姓名', name: 'name' }],
        data: [{ name: null }],
        filename: 'test',
        autoWidth: true,
        format: 'xlsx',
      }

      await exportExcel(params)

      expect(mockCreateElement).toHaveBeenCalledWith('a')
    })

    it('should handle Chinese characters in autoWidth', async () => {
      const params = {
        column: [{ label: '中文列名', name: 'name' }],
        data: [{ name: '中文内容' }],
        filename: 'test',
        autoWidth: true,
        format: 'xlsx',
      }

      await exportExcel(params)

      expect(mockCreateElement).toHaveBeenCalledWith('a')
    })
  })

  describe('addCellStyle', () => {
    it('should apply cell style with default values', () => {
      const cell = {
        fill: {},
        font: {},
        alignment: {},
      }

      addCellStyle(cell, { color: 'dff8ff' })

      expect(cell.fill).toEqual({
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'dff8ff' },
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

    it('should apply cell style with custom values', () => {
      const cell = {
        fill: {},
        font: {},
        alignment: {},
      }

      addCellStyle(cell, {
        color: 'ffffff',
        fontSize: 14,
        horizontal: 'center',
        bold: false,
      })

      expect(cell.fill).toEqual({
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'ffffff' },
      })
      expect(cell.font).toEqual({
        bold: false,
        size: 14,
        color: { argb: 'ff0000' },
      })
      expect(cell.alignment).toEqual({
        vertical: 'middle',
        wrapText: true,
        horizontal: 'center',
      })
    })

    it('should handle undefined attr', () => {
      const cell = {
        fill: {},
        font: {},
        alignment: {},
      }

      addCellStyle(cell, undefined)

      expect(cell.fill).toEqual({
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: undefined },
      })
    })
  })

  describe('exportStyleExcel', () => {
    it('should export styled Excel', async () => {
      const params = {
        column: [
          { label: '姓名', name: 'name' },
          { label: '年龄', name: 'age' },
        ],
        data: [
          { name: '张三', age: 20 },
          { name: '李四', age: 25 },
        ],
        filename: 'styled-test',
        autoWidth: true,
        format: 'xlsx',
      }

      await exportStyleExcel(params)

      expect(mockCreateElement).toHaveBeenCalledWith('a')
    })

    it('should export styled Excel with csv format', async () => {
      const params = {
        column: [{ label: '姓名', name: 'name' }],
        data: [{ name: '张三' }],
        filename: 'styled-test',
        autoWidth: false,
        format: 'csv',
      }

      await exportStyleExcel(params)

      expect(mockCreateElement).toHaveBeenCalledWith('a')
    })

    it('should handle IE browser for styled export', async () => {
      global.window.navigator.msSaveOrOpenBlob = mockMsSaveOrOpenBlob
      global.navigator.msSaveBlob = mockMsSaveBlob

      const params = {
        column: [{ label: '姓名', name: 'name' }],
        data: [{ name: '张三' }],
        filename: 'styled-test',
        autoWidth: false,
        format: 'xlsx',
      }

      await exportStyleExcel(params)

      expect(mockMsSaveBlob).toHaveBeenCalled()
    })
  })

  describe('exportMultiHeaderExcel', () => {
    it('should export Excel with multi-level headers', async () => {
      const params = {
        column: [
          {
            label: '配送消息',
            name: 'delivery',
            children: [
              { label: '省份', name: 'province' },
              { label: '城市', name: 'city' },
              { label: '邮编', name: 'zipcode' },
            ],
          },
        ],
        data: [
          { province: '广东', city: '深圳', zipcode: '518000' },
          { province: '北京', city: '北京', zipcode: '100000' },
        ],
        filename: 'multi-header-test',
        autoWidth: true,
      }

      exportMultiHeaderExcel(params)

      // 由于 exportMultiHeaderExcel 使用 Promise 链式调用，我们需要等待
      await new Promise((resolve) => setTimeout(resolve, 100))
    })

    it('should handle column without children', async () => {
      const params = {
        column: [
          { label: '序号', name: 'index' },
          { label: '日期', name: 'date' },
          { label: '地址', name: 'address' },
        ],
        data: [{ index: 1, date: '2024-01-01', address: '地址1' }],
        filename: 'multi-header-test',
        autoWidth: true,
      }

      exportMultiHeaderExcel(params)

      await new Promise((resolve) => setTimeout(resolve, 100))
    })

    it('should handle empty data', async () => {
      const params = {
        column: [
          {
            label: '配送消息',
            name: 'delivery',
            children: [{ label: '省份', name: 'province' }],
          },
        ],
        data: [],
        filename: 'multi-header-test',
        autoWidth: true,
      }

      exportMultiHeaderExcel(params)

      await new Promise((resolve) => setTimeout(resolve, 100))
    })

    it('should handle IE browser for multi-header export', async () => {
      global.window.navigator.msSaveOrOpenBlob = mockMsSaveOrOpenBlob
      global.navigator.msSaveBlob = mockMsSaveBlob

      const params = {
        column: [
          {
            label: '配送消息',
            name: 'delivery',
            children: [{ label: '省份', name: 'province' }],
          },
        ],
        data: [{ province: '广东' }],
        filename: 'multi-header-test',
        autoWidth: true,
      }

      exportMultiHeaderExcel(params)

      await new Promise((resolve) => setTimeout(resolve, 100))
    })
  })

  describe('DEFAULT_COLUMN_WIDTH', () => {
    it('should have correct default value', () => {
      expect(DEFAULT_COLUMN_WIDTH).toBe(20)
    })
  })
})
