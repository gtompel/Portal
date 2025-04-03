"use client"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  FileText,
  FileImage,
  FileSpreadsheet,
  FileIcon as FilePresentation,
  FilePlus,
  Search,
  MoreVertical,
  Download,
  Share,
  Trash,
} from "lucide-react"

type Document = {
  id: string
  name: string
  type: "doc" | "image" | "spreadsheet" | "presentation"
  owner: string
  updatedAt: string
  size: string
}

const documents: Document[] = [
  {
    id: "DOC-1001",
    name: "Финансовый отчет Q1 2025.xlsx",
    type: "spreadsheet",
    owner: "Иван Петров",
    updatedAt: "2025-04-01",
    size: "2.4 МБ",
  },
  {
    id: "DOC-1002",
    name: "Презентация для клиента.pptx",
    type: "presentation",
    owner: "Мария Сидорова",
    updatedAt: "2025-03-28",
    size: "5.7 МБ",
  },
  {
    id: "DOC-1003",
    name: "Техническая документация.docx",
    type: "doc",
    owner: "Алексей Иванов",
    updatedAt: "2025-03-25",
    size: "1.2 МБ",
  },
  {
    id: "DOC-1004",
    name: "Логотип компании.png",
    type: "image",
    owner: "Елена Смирнова",
    updatedAt: "2025-03-20",
    size: "0.8 МБ",
  },
  {
    id: "DOC-1005",
    name: "План маркетинга 2025.docx",
    type: "doc",
    owner: "Дмитрий Козлов",
    updatedAt: "2025-03-15",
    size: "3.1 МБ",
  },
]

const getDocumentIcon = (type: Document["type"]) => {
  switch (type) {
    case "doc":
      return <FileText className="h-4 w-4 text-blue-500" />
    case "image":
      return <FileImage className="h-4 w-4 text-green-500" />
    case "spreadsheet":
      return <FileSpreadsheet className="h-4 w-4 text-emerald-500" />
    case "presentation":
      return <FilePresentation className="h-4 w-4 text-orange-500" />
    default:
      return <FileText className="h-4 w-4" />
  }
}

export function RecentDocuments() {
  const [searchTerm, setSearchTerm] = useState("")
  const [typeFilter, setTypeFilter] = useState<string>("all")

  const filteredDocuments = documents.filter((doc) => {
    const matchesSearch =
      doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.owner.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesType = typeFilter === "all" || doc.type === typeFilter

    return matchesSearch && matchesType
  })

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="flex gap-2 flex-1">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Поиск документов..."
              className="pl-8 w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Все типы" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все типы</SelectItem>
              <SelectItem value="doc">Документы</SelectItem>
              <SelectItem value="spreadsheet">Таблицы</SelectItem>
              <SelectItem value="presentation">Презентации</SelectItem>
              <SelectItem value="image">Изображения</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button className="gap-1">
          <FilePlus className="h-4 w-4" />
          <span>Загрузить</span>
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Название</TableHead>
              <TableHead>Владелец</TableHead>
              <TableHead>Обновлено</TableHead>
              <TableHead>Размер</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredDocuments.length > 0 ? (
              filteredDocuments.map((doc) => (
                <TableRow key={doc.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getDocumentIcon(doc.type)}
                      <span>{doc.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>{doc.owner}</TableCell>
                  <TableCell>{new Date(doc.updatedAt).toLocaleDateString("ru-RU")}</TableCell>
                  <TableCell>{doc.size}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                          <span className="sr-only">Действия</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Download className="mr-2 h-4 w-4" />
                          <span>Скачать</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Share className="mr-2 h-4 w-4" />
                          <span>Поделиться</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive">
                          <Trash className="mr-2 h-4 w-4" />
                          <span>Удалить</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  Документы не найдены.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

