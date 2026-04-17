import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { autoWidthAction, exportExcel, addCellStyle, exportStyleExcel, exportMultiHeaderExcel, DEFAULT_COLUMN_WIDTH } from './exprotExcel'

vi.mock('exceljs', () => {
  const createMockRow = () => ({
    values: [],
    eachCell: vi.fn((callback) => {
      callback({ fill: {}, font: {}, alignment: {} }, 1)
    }),
  })

  const mockWorksheet = {
    columns: [],
    addRows: vi.fn(),
    getRow: vi.fn(() => createMockRow()),
    mergeCells: vi.fn(),
  }

  const MockWorkbook = vi.fn(() => ({
    creator: '',
    title: '',
    created: null,
    modified: null,
    addWorksheet: vi.fn(() => mockWorksheet),
    xlsx: {
      writeBuffer: () => Promise.resolve(new ArrayBuffer(10)),
    },
    csv: {
      writeBuffer: () => Promise.resolve(new ArrayBuffer(10)),
    },
  }))

  return {
    default: {
      Workbook: MockWorkbook,
    },
  }
})

describe('autoWidthAction', () => {
  it('should return 10 when val is null', () => {
    expect(autoWidthAction(null)).toBe(10)
  })

  it('should return 10 when val is undefined', () => {
    expect(autoWidthAction(undefined)).toBe(10)
  })

  it('should return double length for Chinese characters (first char is Chinese)', () => {
    expect(autoWidthAction('中文测试')).toBe(8)
  })

  it('should return correct width for English characters', () => {
    expect(autoWidthAction('hello')).toBe(5)
  })

  it('should return length when first char is English (even if contains Chinese)', () => {
    expect(autoWidthAction('hello中文')).toBe(7)
  })

  it('should return correct width for numbers', () => {
    expect(autoWidthAction(12345)).toBe(5)
  })

  it('should return correct width for empty string', () => {
    expect(autoWidthAction('')).toBe(0)
  })
})

describe('DEFAULT_COLUMN_WIDTH', () => {
  it('should have default column width of 20', () => {
    expect(DEFAULT_COLUMN_WIDTH).toBe(20)
  })
})

describe('addCellStyle', () => {
  it('should set cell fill, font, and alignment with default values', () => {
    const mockCell = {
      fill: {},
      font: {},
      alignment: {},
    }

    addCellStyle(mockCell, { color: 'ffffff' })

    expect(mockCell.fill).toEqual({
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'ffffff' },
    })
    expect(mockCell.font).toEqual({
      bold: true,
      size: 11,
      color: { argb: 'ff0000' },
    })
    expect(mockCell.alignment).toEqual({
      vertical: 'middle',
      wrapText: true,
      horizontal: 'left',
    })
  })

  it('should set cell styles with custom values', () => {
    const mockCell = {
      fill: {},
      font: {},
      alignment: {},
    }

    addCellStyle(mockCell, {
      color: 'dff8ff',
      fontSize: 14,
      horizontal: 'center',
      bold: false,
    })

    expect(mockCell.fill.fgColor.argb).toBe('dff8ff')
    expect(mockCell.font.bold).toBe(false)
    expect(mockCell.font.size).toBe(14)
    expect(mockCell.alignment.horizontal).toBe('center')
  })

  it('should handle undefined attr parameter', () => {
    const mockCell = {
      fill: {},
      font: {},
      alignment: {},
    }

    addCellStyle(mockCell, undefined)

    expect(mockCell.fill.type).toBe('pattern')
    expect(mockCell.font.bold).toBe(true)
    expect(mockCell.alignment.horizontal).toBe('left')
  })
})

describe('exportExcel', () => {
  let mockLink: HTMLAnchorElement

  beforeEach(() => {
    mockLink = {
      href: '',
      download: '',
      click: vi.fn(),
    } as unknown as HTMLAnchorElement

    vi.spyOn(document, 'createElement').mockReturnValue(mockLink)
    vi.spyOn(window.URL, 'createObjectURL').mockReturnValue('blob:test')
    vi.spyOn(window.URL, 'revokeObjectURL').mockImplementation(() => {})
    vi.spyOn(window, 'Blob').mockImplementation((args) => args as unknown as Blob)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should export data to xlsx format', async () => {
    const column = [
      { label: '姓名', name: 'name' },
      { label: '年龄', name: 'age' },
    ]
    const data = [
      { name: '张三', age: 25 },
      { name: '李四', age: 30 },
    ]

    await exportExcel({
      column,
      data,
      filename: 'test',
      autoWidth: true,
      format: 'xlsx',
    })

    expect(document.createElement).toHaveBeenCalledWith('a')
    expect(mockLink.click).toHaveBeenCalled()
  })

  it('should export data to csv format', async () => {
    const column = [{ label: 'ID', name: 'id' }]
    const data = [{ id: 1 }, { id: 2 }]

    await exportExcel({
      column,
      data,
      filename: 'test-csv',
      autoWidth: false,
      format: 'csv',
    })

    expect(mockLink.download).toBe('test-csv.csv')
  })

  it('should handle empty data', async () => {
    const column = [{ label: '名称', name: 'name' }]
    const data: any[] = []

    await exportExcel({
      column,
      data,
      filename: 'empty',
      autoWidth: true,
      format: 'xlsx',
    })

    expect(mockLink.click).toHaveBeenCalled()
  })
})

describe('exportStyleExcel', () => {
  let mockLink: HTMLAnchorElement

  beforeEach(() => {
    mockLink = {
      href: '',
      download: '',
      click: vi.fn(),
    } as unknown as HTMLAnchorElement

    vi.spyOn(document, 'createElement').mockReturnValue(mockLink)
    vi.spyOn(window.URL, 'createObjectURL').mockReturnValue('blob:test')
    vi.spyOn(window.URL, 'revokeObjectURL').mockImplementation(() => {})
    vi.spyOn(window, 'Blob').mockImplementation((args) => args as unknown as Blob)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should export styled excel with header styling', async () => {
    const column = [
      { label: '产品', name: 'product' },
      { label: '价格', name: 'price' },
    ]
    const data = [
      { product: '手机', price: '2999' },
      { product: '电脑', price: '5999' },
    ]

    await exportStyleExcel({
      column,
      data,
      filename: 'styled-test',
      autoWidth: true,
      format: 'xlsx',
    })

    expect(mockLink.click).toHaveBeenCalled()
    expect(mockLink.download).toBe('styled-test.xlsx')
  })

  it('should handle csv format with style export', async () => {
    const column = [{ label: '编号', name: 'code' }]
    const data = [{ code: 'A001' }]

    await exportStyleExcel({
      column,
      data,
      filename: 'style-csv',
      autoWidth: false,
      format: 'csv',
    })

    expect(mockLink.download).toBe('style-csv.csv')
  })
})

describe('exportMultiHeaderExcel', () => {
  let mockLink: HTMLAnchorElement

  beforeEach(() => {
    mockLink = {
      href: '',
      download: '',
      click: vi.fn(),
    } as unknown as HTMLAnchorElement

    vi.spyOn(document, 'createElement').mockReturnValue(mockLink)
    vi.spyOn(window.URL, 'createObjectURL').mockReturnValue('blob:test')
    vi.spyOn(window.URL, 'revokeObjectURL').mockImplementation(() => {})
    vi.spyOn(window, 'Blob').mockImplementation((args) => args as unknown as Blob)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should export multi-header excel', async () => {
    const column = [
      { label: '序号', name: 'id' },
      { label: '日期', name: 'date' },
      { label: '地址', name: 'address' },
      {
        label: '配送消息',
        name: 'delivery',
        children: [
          { label: '省份', name: 'province' },
          { label: '城市', name: 'city' },
          { label: '邮编', name: 'zip' },
        ],
      },
    ]
    const data = [{ id: 1, date: '2024-01-01', address: '测试地址', province: '北京', city: '北京', zip: '100000' }]

    await exportMultiHeaderExcel({
      column,
      data,
      filename: 'multi-header-test',
      autoWidth: true,
    })

    expect(document.createElement).toHaveBeenCalledWith('a')
  })

  it('should handle column without children', async () => {
    const column = [
      { label: 'ID', name: 'id' },
      { label: '名称', name: 'name' },
    ]
    const data = [
      { id: 1, name: '测试1' },
      { id: 2, name: '测试2' },
    ]

    await exportMultiHeaderExcel({
      column,
      data,
      filename: 'simple-test',
      autoWidth: false,
    })

    expect(mockLink.click).toHaveBeenCalled()
  })
})
