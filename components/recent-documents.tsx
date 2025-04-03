"use client"

import { useState, useEffect } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useSession } from "next-auth/react"
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
  Loader2,
} from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"

// Типы данных
type Document = {
  id: string
  name: string
  type: "DOC" | "SPREADSHEET" | "PRESENTATION" | "IMAGE" | "PDF" | "OTHER"
  owner: {
    id: string
    name: string
  }
  updatedAt: string
  size: string
}

export function RecentDocuments() {
  const { data: session } = useSession()
  const [documents, setDocuments] = useState<Document[]>([])
  const [filteredDocuments, setFilteredDocuments] = useState<Document[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [isLoading, setIsLoading] = useState(true)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Форма загрузки документа
  const documentSchema = z.object({
    name: z.string().min(3, "Название должно содержать минимум 3 символа"),
    type: z.enum(["DOC", "SPREADSHEET", "PRESENTATION", "IMAGE", "PDF", "OTHER"]),
    description: z.string().optional(),
    file: z.instanceof(FileList).refine((files) => files.length > 0, "Выберите файл для загрузки"),
  })

  const form = useForm<z.infer<typeof documentSchema>>({
    resolver: zodResolver(documentSchema),
    defaultValues: {
      name: "",
      type: "DOC",
      description: "",
    },
  })

  useEffect(() => {
    fetchDocuments()
  }, [])

  useEffect(() => {
    if (documents.length) {
      filterDocuments()
    }
  }, [searchTerm, typeFilter, documents])

  const fetchDocuments = async () => {
    try {
      setIsLoading(true)

      // В реальном приложении здесь должен быть запрос к API
      // const response = await fetch('/api/documents');
      // const data = await response.json();

      // Временно используем заглушку для демонстрации
      // В реальном коде эти данные должны приходить с сервера
      setTimeout(() => {
        const mockDocuments: Document[] = [
          {
            id: "DOC-1001",
            name: "Финансовый отчет Q1 2025.xlsx",
            type: "SPREADSHEET",
            owner: {
              id: "user-1",
              name: "Иван Петров",
            },
            updatedAt: "2025-04-01",
            size: "2.4 МБ",
          },
          {
            id: "DOC-1002",
            name: "Презентация для клиента.pptx",
            type: "PRESENTATION",
            owner: {
              id: "user-2",
              name: "Мария Сидорова",
            },
            updatedAt: "2025-03-28",
            size: "5.7 МБ",
          },
          {
            id: "DOC-1003",
            name: "Техническая документация.docx",
            type: "DOC",
            owner: {
              id: "user-3",
              name: "Алексей Иванов",
            },
            updatedAt: "2025-03-25",
            size: "1.2 МБ",
          },
        ]

        setDocuments(mockDocuments)
        setFilteredDocuments(mockDocuments)
        setIsLoading(false)
      }, 1000)
    } catch (err) {
      console.error("Ошибка при загрузке документов:", err)
      setError("Не удалось загрузить документы")
      setIsLoading(false)
    }
  }

  const filterDocuments = () => {
    let result = [...documents]

    if (searchTerm) {
      result = result.filter(
        (doc) =>
          doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          doc.owner.name.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    if (typeFilter !== "all") {
      result = result.filter((doc) => doc.type === typeFilter)
    }

    setFilteredDocuments(result)
  }

  const getDocumentIcon = (type: Document["type"]) => {
    switch (type) {
      case "DOC":
        return <FileText className="h-4 w-4 text-blue-500" />
      case "IMAGE":
        return <FileImage className="h-4 w-4 text-green-500" />
      case "SPREADSHEET":
        return <FileSpreadsheet className="h-4 w-4 text-emerald-500" />
      case "PRESENTATION":
        return <FilePresentation className="h-4 w-4 text-orange-500" />
      case "PDF":
        return <FileText className="h-4 w-4 text-red-500" />
      default:
        return <FileText className="h-4 w-4" />
    }
  }

  const uploadDocument = async (data: z.infer<typeof documentSchema>) => {
    setIsUploading(true)

    try {
      // В реальном приложении здесь был бы код для загрузки файла на сервер
      // и сохранения информации о документе в базе данных

      // Временная имитация загрузки
      setTimeout(() => {
        const file = data.file[0]

        const newDocument: Document = {
          id: `DOC-${Date.now()}`,
          name: data.name || file.name,
          type: data.type,
          owner: {
            id: session?.user?.id || "unknown",
            name: session?.user?.name || "Пользователь",
          },
          updatedAt: new Date().toISOString(),
          size: `${(file.size / (1024 * 1024)).toFixed(1)} МБ`,
        }

        setDocuments((prev) => [newDocument, ...prev])
        setIsUploading(false)
        form.reset()
      }, 1500)
    } catch (err) {
      console.error("Ошибка при загрузке документа:", err)
      setIsUploading(false)
    }
  }

  if (error) {
    return (
      <div className="space-y-4">
        <div className="p-6 bg-destructive/10 rounded-md">
          <h3 className="font-semibold">Ошибка загрузки</h3>
          <p>{error}</p>
          <Button onClick={fetchDocuments} className="mt-2">
            Повторить
          </Button>
        </div>
      </div>
    )
  }

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
              <SelectItem value="DOC">Документы</SelectItem>
              <SelectItem value="SPREADSHEET">Таблицы</SelectItem>
              <SelectItem value="PRESENTATION">Презентации</SelectItem>
              <SelectItem value="IMAGE">Изображения</SelectItem>
              <SelectItem value="PDF">PDF</SelectItem>
              <SelectItem value="OTHER">Другие</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Dialog>
          <DialogTrigger asChild>
            <Button className="gap-1">
              <FilePlus className="h-4 w-4" />
              <span>Загрузить</span>
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Загрузить документ</DialogTitle>
              <DialogDescription>Выберите файл для загрузки и заполните информацию о документе.</DialogDescription>
            </DialogHeader>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(uploadDocument)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="file"
                  render={({ field: { onChange, value, ...rest } }) => (
                    <FormItem>
                      <FormLabel>Файл *</FormLabel>
                      <FormControl>
                        <Input type="file" onChange={(e) => onChange(e.target.files)} {...rest} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Название документа</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Введите название или оставьте пустым для использования имени файла"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Тип документа *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Выберите тип документа" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="DOC">Документ</SelectItem>
                          <SelectItem value="SPREADSHEET">Таблица</SelectItem>
                          <SelectItem value="PRESENTATION">Презентация</SelectItem>
                          <SelectItem value="IMAGE">Изображение</SelectItem>
                          <SelectItem value="PDF">PDF</SelectItem>
                          <SelectItem value="OTHER">Другое</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Описание</FormLabel>
                      <FormControl>
                        <Input placeholder="Краткое описание документа" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <DialogFooter>
                  <Button type="submit" disabled={isUploading}>
                    {isUploading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Загрузка...
                      </>
                    ) : (
                      "Загрузить документ"
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
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
            {isLoading ? (
              Array(5)
                .fill(0)
                .map((_, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Skeleton className="h-4 w-4" />
                        <Skeleton className="h-4 w-full" />
                      </div>
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-24" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-24" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-16" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-8 w-8 rounded-full" />
                    </TableCell>
                  </TableRow>
                ))
            ) : filteredDocuments.length > 0 ? (
              filteredDocuments.map((doc) => (
                <TableRow key={doc.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getDocumentIcon(doc.type)}
                      <span>{doc.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>{doc.owner.name}</TableCell>
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

