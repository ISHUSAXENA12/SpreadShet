"use client"

import type React from "react"
import { useState, useCallback, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  ChevronDown,
  Plus,
  X,
  Undo,
  Redo,
  Copy,
  Scissors,
  ClipboardPaste,
  Download,
  Upload,
  Share,
  Menu,
  Search,
  Filter,
  SortAsc,
  MoreHorizontal,
  Grid3X3,
  Type,
  Palette,
  FlagIcon as BorderAll,
  Percent,
  DollarSign,
  Hash,
} from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface CellStyle {
  bold?: boolean
  italic?: boolean
  underline?: boolean
  align?: "left" | "center" | "right"
  backgroundColor?: string
  textColor?: string
  fontSize?: number
  fontFamily?: string
  format?: "general" | "number" | "currency" | "percentage" | "date" | "text"
  border?: string
}

interface CellData {
  value: string
  formula?: string
  style?: CellStyle
  type?: "text" | "number" | "formula" | "date"
}

interface SheetData {
  [key: string]: CellData
}

const COLUMNS = Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i))
const ROWS = Array.from({ length: 100 }, (_, i) => i + 1)

const FONTS = ["Arial", "Helvetica", "Times New Roman", "Calibri", "Verdana", "Georgia", "Courier New", "Comic Sans MS"]

const FONT_SIZES = [8, 9, 10, 11, 12, 14, 16, 18, 20, 24, 28, 32, 36, 48]

const COLORS = [
  "#000000",
  "#434343",
  "#666666",
  "#999999",
  "#b7b7b7",
  "#cccccc",
  "#d9d9d9",
  "#efefef",
  "#f3f3f3",
  "#ffffff",
  "#980000",
  "#ff0000",
  "#ff9900",
  "#ffff00",
  "#00ff00",
  "#00ffff",
  "#4a86e8",
  "#0000ff",
  "#9900ff",
  "#ff00ff",
  "#e6b8af",
  "#f4cccc",
  "#fce5cd",
  "#fff2cc",
  "#d9ead3",
  "#d0e0e3",
  "#c9daf8",
  "#cfe2f3",
  "#d9d2e9",
  "#ead1dc",
  "#dd7e6b",
  "#ea9999",
  "#f9cb9c",
  "#ffe599",
  "#b6d7a8",
  "#a2c4c9",
  "#a4c2f4",
  "#9fc5e8",
  "#b4a7d6",
  "#d5a6bd",
  "#cc4125",
  "#e06666",
  "#f6b26b",
  "#ffd966",
  "#93c47d",
  "#76a5af",
  "#6d9eeb",
  "#6fa8dc",
  "#8e7cc3",
  "#c27ba0",
  "#a61c00",
  "#cc0000",
  "#e69138",
  "#f1c232",
  "#6aa84f",
  "#45818e",
  "#3c78d8",
  "#3d85c6",
  "#674ea7",
  "#a64d79",
  "#85200c",
  "#990000",
  "#b45f06",
  "#bf9000",
  "#38761d",
  "#134f5c",
  "#1155cc",
  "#0b5394",
  "#351c75",
  "#741b47",
  "#5b0f00",
  "#660000",
  "#783f04",
  "#7f6000",
  "#274e13",
  "#0c343d",
  "#1c4587",
  "#073763",
  "#20124d",
  "#4c1130",
]

export default function FigmaSpreadsheetReplica() {
  const [sheets, setSheets] = useState<{ [key: string]: SheetData }>({
    Sheet1: {},
  })
  const [activeSheet, setActiveSheet] = useState("Sheet1")
  const [selectedCell, setSelectedCell] = useState<string>("A1")
  const [selectedRange, setSelectedRange] = useState<string[]>([])
  const [formulaBarValue, setFormulaBarValue] = useState("")
  const [isEditing, setIsEditing] = useState(false)
  const [history, setHistory] = useState<any[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const [clipboard, setClipboard] = useState<{ [key: string]: CellData } | null>(null)

  const formulaBarRef = useRef<HTMLInputElement>(null)
  const gridRef = useRef<HTMLDivElement>(null)

  // Initialize with sample data
  useEffect(() => {
    const sampleData: SheetData = {
      A1: { value: "Name", style: { bold: true, backgroundColor: "#f8f9fa" } },
      B1: { value: "Age", style: { bold: true, backgroundColor: "#f8f9fa" } },
      C1: { value: "City", style: { bold: true, backgroundColor: "#f8f9fa" } },
      D1: { value: "Salary", style: { bold: true, backgroundColor: "#f8f9fa", format: "currency" } },
      A2: { value: "John Doe" },
      B2: { value: "28", type: "number" },
      C2: { value: "New York" },
      D2: { value: "75000", type: "number", style: { format: "currency" } },
      A3: { value: "Jane Smith" },
      B3: { value: "32", type: "number" },
      C3: { value: "Los Angeles" },
      D3: { value: "82000", type: "number", style: { format: "currency" } },
      A4: { value: "Mike Johnson" },
      B4: { value: "25", type: "number" },
      C4: { value: "Chicago" },
      D4: { value: "68000", type: "number", style: { format: "currency" } },
    }

    setSheets((prev) => ({
      ...prev,
      Sheet1: sampleData,
    }))
  }, [])

  const getCellKey = (col: string, row: number) => `${col}${row}`

  const getCellValue = useCallback(
    (col: string, row: number) => {
      const key = getCellKey(col, row)
      const cell = sheets[activeSheet]?.[key]
      if (!cell) return ""

      if (cell.formula) {
        return evaluateFormula(cell.formula)
      }
      return cell.value || ""
    },
    [sheets, activeSheet],
  )

  const getCellData = useCallback(
    (col: string, row: number) => {
      const key = getCellKey(col, row)
      return sheets[activeSheet]?.[key] || { value: "", style: {} }
    },
    [sheets, activeSheet],
  )

  const evaluateFormula = (formula: string): string => {
    if (!formula.startsWith("=")) return formula

    try {
      let expression = formula.slice(1)

      // Replace cell references with values
      expression = expression.replace(/([A-Z]+)(\d+)/g, (match, col, row) => {
        const cellData = sheets[activeSheet]?.[`${col}${row}`]
        if (!cellData) return "0"
        const value = cellData.formula ? evaluateFormula(cellData.formula) : cellData.value
        return Number.parseFloat(value) || 0
      })

      // Basic math evaluation
      const result = Function(`"use strict"; return (${expression})`)()
      return result.toString()
    } catch {
      return "#ERROR"
    }
  }

  const formatCellValue = (value: string, style?: CellStyle): string => {
    if (!style?.format || style.format === "general") return value

    const numValue = Number.parseFloat(value)
    if (isNaN(numValue)) return value

    switch (style.format) {
      case "currency":
        return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(numValue)
      case "percentage":
        return new Intl.NumberFormat("en-US", { style: "percent" }).format(numValue / 100)
      case "number":
        return new Intl.NumberFormat("en-US").format(numValue)
      default:
        return value
    }
  }

  const updateCell = useCallback(
    (col: string, row: number, updates: Partial<CellData>) => {
      const key = getCellKey(col, row)
      setSheets((prev) => ({
        ...prev,
        [activeSheet]: {
          ...prev[activeSheet],
          [key]: {
            ...prev[activeSheet]?.[key],
            ...updates,
          },
        },
      }))
    },
    [activeSheet],
  )

  const handleCellClick = (col: string, row: number, event: React.MouseEvent) => {
    const key = getCellKey(col, row)

    if (event.shiftKey && selectedCell) {
      // Range selection logic
      const [startCol, startRow] = [selectedCell.charAt(0), Number.parseInt(selectedCell.slice(1))]
      const range = []
      const minCol = Math.min(startCol.charCodeAt(0), col.charCodeAt(0))
      const maxCol = Math.max(startCol.charCodeAt(0), col.charCodeAt(0))
      const minRow = Math.min(Number.parseInt(startRow), row)
      const maxRow = Math.max(Number.parseInt(startRow), row)

      for (let c = minCol; c <= maxCol; c++) {
        for (let r = minRow; r <= maxRow; r++) {
          range.push(`${String.fromCharCode(c)}${r}`)
        }
      }
      setSelectedRange(range)
    } else {
      setSelectedCell(key)
      setSelectedRange([])
      const cellData = getCellData(col, row)
      setFormulaBarValue(cellData.formula || cellData.value || "")
    }
    setIsEditing(false)
  }

  const handleCellDoubleClick = (col: string, row: number) => {
    const key = getCellKey(col, row)
    setSelectedCell(key)
    setIsEditing(true)
    const cellData = getCellData(col, row)
    setFormulaBarValue(cellData.value || "")
  }

  const handleFormulaBarChange = (value: string) => {
    setFormulaBarValue(value)
    if (selectedCell) {
      const [col, ...rowParts] = selectedCell.split("")
      const row = Number.parseInt(rowParts.join(""))
      const isFormula = value.startsWith("=")
      updateCell(col, row, {
        value,
        formula: isFormula ? value : undefined,
        type: isFormula ? "formula" : isNaN(Number.parseFloat(value)) ? "text" : "number",
      })
    }
  }

  const applyFormatting = (format: Partial<CellStyle>) => {
    if (!selectedCell) return

    const targets = selectedRange.length > 0 ? selectedRange : [selectedCell]

    targets.forEach((cellKey) => {
      const [col, ...rowParts] = cellKey.split("")
      const row = Number.parseInt(rowParts.join(""))
      const currentData = getCellData(col, row)
      updateCell(col, row, {
        style: { ...currentData.style, ...format },
      })
    })
  }

  const getCurrentCellStyle = (): CellStyle => {
    if (!selectedCell) return {}
    const [col, ...rowParts] = selectedCell.split("")
    const row = Number.parseInt(rowParts.join(""))
    return getCellData(col, row).style || {}
  }

  const addSheet = () => {
    const newSheetName = `Sheet${Object.keys(sheets).length + 1}`
    setSheets((prev) => ({ ...prev, [newSheetName]: {} }))
    setActiveSheet(newSheetName)
  }

  const removeSheet = (sheetName: string) => {
    if (Object.keys(sheets).length <= 1) return

    setSheets((prev) => {
      const newSheets = { ...prev }
      delete newSheets[sheetName]
      return newSheets
    })

    if (activeSheet === sheetName) {
      setActiveSheet(Object.keys(sheets).find((name) => name !== sheetName) || "Sheet1")
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!selectedCell) return

    const [col, ...rowParts] = selectedCell.split("")
    const row = Number.parseInt(rowParts.join(""))

    switch (e.key) {
      case "ArrowUp":
        if (row > 1) setSelectedCell(`${col}${row - 1}`)
        break
      case "ArrowDown":
        if (row < ROWS.length) setSelectedCell(`${col}${row + 1}`)
        break
      case "ArrowLeft":
        if (col > "A") setSelectedCell(`${String.fromCharCode(col.charCodeAt(0) - 1)}${row}`)
        break
      case "ArrowRight":
        if (col < "Z") setSelectedCell(`${String.fromCharCode(col.charCodeAt(0) + 1)}${row}`)
        break
      case "Enter":
        if (isEditing) {
          setIsEditing(false)
          handleFormulaBarChange(formulaBarValue)
        } else {
          setIsEditing(true)
        }
        break
      case "Escape":
        setIsEditing(false)
        const cellData = getCellData(col, row)
        setFormulaBarValue(cellData.formula || cellData.value || "")
        break
      case "Delete":
        updateCell(col, row, { value: "", formula: undefined })
        setFormulaBarValue("")
        break
    }
  }

  return (
    <div className="h-screen flex flex-col bg-white" onKeyDown={handleKeyDown} tabIndex={0}>
      {/* Header */}
      <div className="border-b border-gray-200 bg-white">
        {/* Top Bar */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Grid3X3 className="w-6 h-6 text-green-600" />
              <span className="text-lg font-medium text-gray-900">Sheets</span>
            </div>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="sm">
                <Menu className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm">
                <Search className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Upload className="w-4 h-4 mr-2" />
              Import
            </Button>
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
              <Share className="w-4 h-4 mr-2" />
              Share
            </Button>
          </div>
        </div>

        {/* Toolbar */}
        <div className="px-4 py-2">
          <div className="flex items-center gap-1 flex-wrap">
            {/* Undo/Redo */}
            <Button variant="ghost" size="sm">
              <Undo className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm">
              <Redo className="w-4 h-4" />
            </Button>

            <Separator orientation="vertical" className="h-6 mx-1" />

            {/* Clipboard */}
            <Button variant="ghost" size="sm">
              <Scissors className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm">
              <Copy className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm">
              <ClipboardPaste className="w-4 h-4" />
            </Button>

            <Separator orientation="vertical" className="h-6 mx-1" />

            {/* Font */}
            <Select defaultValue="Arial">
              <SelectTrigger className="w-28 h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FONTS.map((font) => (
                  <SelectItem key={font} value={font}>
                    {font}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select defaultValue="11">
              <SelectTrigger className="w-16 h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FONT_SIZES.map((size) => (
                  <SelectItem key={size} value={size.toString()}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Separator orientation="vertical" className="h-6 mx-1" />

            {/* Text Formatting */}
            <Button
              variant={getCurrentCellStyle().bold ? "default" : "ghost"}
              size="sm"
              onClick={() => applyFormatting({ bold: !getCurrentCellStyle().bold })}
            >
              <Bold className="w-4 h-4" />
            </Button>
            <Button
              variant={getCurrentCellStyle().italic ? "default" : "ghost"}
              size="sm"
              onClick={() => applyFormatting({ italic: !getCurrentCellStyle().italic })}
            >
              <Italic className="w-4 h-4" />
            </Button>
            <Button
              variant={getCurrentCellStyle().underline ? "default" : "ghost"}
              size="sm"
              onClick={() => applyFormatting({ underline: !getCurrentCellStyle().underline })}
            >
              <Underline className="w-4 h-4" />
            </Button>

            <Separator orientation="vertical" className="h-6 mx-1" />

            {/* Alignment */}
            <Button
              variant={getCurrentCellStyle().align === "left" ? "default" : "ghost"}
              size="sm"
              onClick={() => applyFormatting({ align: "left" })}
            >
              <AlignLeft className="w-4 h-4" />
            </Button>
            <Button
              variant={getCurrentCellStyle().align === "center" ? "default" : "ghost"}
              size="sm"
              onClick={() => applyFormatting({ align: "center" })}
            >
              <AlignCenter className="w-4 h-4" />
            </Button>
            <Button
              variant={getCurrentCellStyle().align === "right" ? "default" : "ghost"}
              size="sm"
              onClick={() => applyFormatting({ align: "right" })}
            >
              <AlignRight className="w-4 h-4" />
            </Button>

            <Separator orientation="vertical" className="h-6 mx-1" />

            {/* Colors */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <Type className="w-4 h-4" />
                  <ChevronDown className="w-3 h-3 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-64">
                <div className="p-2">
                  <div className="grid grid-cols-10 gap-1">
                    {COLORS.map((color) => (
                      <button
                        key={color}
                        className="w-5 h-5 rounded border border-gray-300 hover:scale-110 transition-transform"
                        style={{ backgroundColor: color }}
                        onClick={() => applyFormatting({ textColor: color })}
                      />
                    ))}
                  </div>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <Palette className="w-4 h-4" />
                  <ChevronDown className="w-3 h-3 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-64">
                <div className="p-2">
                  <div className="grid grid-cols-10 gap-1">
                    {COLORS.map((color) => (
                      <button
                        key={color}
                        className="w-5 h-5 rounded border border-gray-300 hover:scale-110 transition-transform"
                        style={{ backgroundColor: color }}
                        onClick={() => applyFormatting({ backgroundColor: color })}
                      />
                    ))}
                  </div>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

            <Separator orientation="vertical" className="h-6 mx-1" />

            {/* Number Formats */}
            <Button variant="ghost" size="sm" onClick={() => applyFormatting({ format: "currency" })}>
              <DollarSign className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => applyFormatting({ format: "percentage" })}>
              <Percent className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => applyFormatting({ format: "number" })}>
              <Hash className="w-4 h-4" />
            </Button>

            <Separator orientation="vertical" className="h-6 mx-1" />

            {/* More Options */}
            <Button variant="ghost" size="sm">
              <BorderAll className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm">
              <Filter className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm">
              <SortAsc className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm">
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Formula Bar */}
      <div className="border-b border-gray-200 bg-gray-50 px-4 py-2">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-16 h-8 bg-white border border-gray-300 rounded flex items-center justify-center text-sm font-medium">
              {selectedCell}
            </div>
            <div className="text-sm text-gray-600">fx</div>
          </div>
          <div className="flex-1">
            <Input
              ref={formulaBarRef}
              value={formulaBarValue}
              onChange={(e) => setFormulaBarValue(e.target.value)}
              onBlur={() => handleFormulaBarChange(formulaBarValue)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleFormulaBarChange(formulaBarValue)
                  setIsEditing(false)
                }
                if (e.key === "Escape") {
                  setIsEditing(false)
                  if (selectedCell) {
                    const [col, ...rowParts] = selectedCell.split("")
                    const row = Number.parseInt(rowParts.join(""))
                    const cellData = getCellData(col, row)
                    setFormulaBarValue(cellData.formula || cellData.value || "")
                  }
                }
              }}
              placeholder="Enter formula or value..."
              className="h-8 border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Spreadsheet Grid */}
      <div className="flex-1 overflow-auto bg-white" ref={gridRef}>
        <div className="inline-block min-w-full">
          <table className="border-collapse">
            <thead className="sticky top-0 z-10">
              <tr>
                <th className="w-12 h-8 bg-gray-100 border-r border-b border-gray-300 text-xs font-medium text-gray-600 sticky left-0 z-20"></th>
                {COLUMNS.map((col) => (
                  <th
                    key={col}
                    className="w-24 h-8 bg-gray-100 border-r border-b border-gray-300 text-xs font-medium text-gray-600 hover:bg-gray-200 transition-colors cursor-pointer"
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ROWS.map((row) => (
                <tr key={row}>
                  <td className="w-12 h-7 bg-gray-100 border-r border-b border-gray-300 text-xs font-medium text-gray-600 text-center sticky left-0 z-10 hover:bg-gray-200 transition-colors cursor-pointer">
                    {row}
                  </td>
                  {COLUMNS.map((col) => {
                    const cellKey = getCellKey(col, row)
                    const isSelected = selectedCell === cellKey
                    const isInRange = selectedRange.includes(cellKey)
                    const cellData = getCellData(col, row)
                    const displayValue = formatCellValue(getCellValue(col, row), cellData.style)
                    const style = cellData.style || {}

                    return (
                      <td
                        key={cellKey}
                        className={`w-24 h-7 border-r border-b border-gray-300 cursor-cell relative transition-all ${
                          isSelected
                            ? "ring-2 ring-blue-500 bg-blue-50 z-10"
                            : isInRange
                              ? "bg-blue-100"
                              : "hover:bg-gray-50"
                        }`}
                        onClick={(e) => handleCellClick(col, row, e)}
                        onDoubleClick={() => handleCellDoubleClick(col, row)}
                      >
                        {isSelected && isEditing ? (
                          <Input
                            value={formulaBarValue}
                            onChange={(e) => setFormulaBarValue(e.target.value)}
                            onBlur={() => {
                              setIsEditing(false)
                              handleFormulaBarChange(formulaBarValue)
                            }}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                setIsEditing(false)
                                handleFormulaBarChange(formulaBarValue)
                              }
                              if (e.key === "Escape") {
                                setIsEditing(false)
                                setFormulaBarValue(cellData.value || "")
                              }
                            }}
                            className="w-full h-full border-0 p-1 text-xs focus-visible:ring-0 focus-visible:ring-offset-0 bg-white"
                            autoFocus
                          />
                        ) : (
                          <div
                            className={`w-full h-full p-1 text-xs overflow-hidden whitespace-nowrap ${
                              style.bold ? "font-bold" : ""
                            } ${style.italic ? "italic" : ""} ${style.underline ? "underline" : ""} ${
                              style.align === "center"
                                ? "text-center"
                                : style.align === "right"
                                  ? "text-right"
                                  : "text-left"
                            }`}
                            style={{
                              backgroundColor: style.backgroundColor,
                              color: style.textColor,
                              fontSize: style.fontSize ? `${style.fontSize}px` : undefined,
                              fontFamily: style.fontFamily,
                            }}
                          >
                            {displayValue}
                          </div>
                        )}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Sheet Tabs */}
      <div className="border-t border-gray-200 bg-white px-4 py-2 flex items-center gap-1">
        <div className="flex items-center gap-1 flex-1 overflow-x-auto">
          {Object.keys(sheets).map((sheetName) => (
            <div key={sheetName} className="flex items-center group">
              <Button
                variant={activeSheet === sheetName ? "default" : "ghost"}
                size="sm"
                onClick={() => setActiveSheet(sheetName)}
                className={`h-8 px-4 text-xs rounded-t-lg rounded-b-none ${
                  activeSheet === sheetName
                    ? "bg-white border border-b-0 border-gray-300 text-gray-900"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                {sheetName}
              </Button>
              {Object.keys(sheets).length > 1 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeSheet(sheetName)}
                  className="h-6 w-6 p-0 ml-1 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-3 h-3" />
                </Button>
              )}
            </div>
          ))}
        </div>

        <Button variant="ghost" size="sm" onClick={addSheet} className="h-8 w-8 p-0">
          <Plus className="w-4 h-4" />
        </Button>
      </div>
    </div>
  )
}
