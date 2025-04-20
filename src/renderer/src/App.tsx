import React, { useState } from 'react'
import {
  Button,
  TextField,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Tooltip,
  Box,
  Typography,
  Paper
} from '@mui/material'
import { Delete, Edit } from '@mui/icons-material'
import { motion } from 'framer-motion'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useSortable } from '@dnd-kit/sortable'

interface WordItem {
  id: string
  word: string
  definition?: string
  phonetic?: string
}

const WordListManager: React.FC = () => {
  // 初始化单词列表状态
  const [words, setWords] = useState<WordItem[]>([])
  // 初始化模态框打开状态
  const [isModalOpen, setIsModalOpen] = useState(false)
  // 初始化当前单词状态
  const [currentWord, setCurrentWord] = useState<Partial<WordItem>>({})
  // 初始化正在编辑的单词索引状态
  const [editingIndex, setEditingIndex] = useState<number | null>(null)

  // 配置拖拽传感器
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates
    })
  )

  // 添加单词的处理函数
  const handleAddWord = () => {
    setIsModalOpen(true) // 打开模态框
    setCurrentWord({}) // 清空当前单词状态
    setEditingIndex(null) // 清空编辑索引状态
  }

  // 保存单词的处理函数
  const handleSaveWord = () => {
    // 检查单词是否为空
    if (!currentWord.word || currentWord.word.trim() === '') {
      alert('单词不能为空！') // 弹出提示框
      return
    }

    // 如果正在编辑单词，更新单词列表
    if (editingIndex !== null) {
      const updatedWords = [...words]
      updatedWords[editingIndex] = { ...updatedWords[editingIndex], ...currentWord }
      setWords(updatedWords)
    } else {
      // 如果是添加新单词，将新单词添加到单词列表中
      setWords([...words, { id: `${Date.now()}`, ...currentWord } as WordItem])
    }
    setIsModalOpen(false) // 关闭模态框
  }

  // 删除单词的处理函数
  const handleDeleteWord = (id: string) => {
    // 过滤掉要删除的单词
    setWords(words.filter((word) => word.id !== id))
  }

  // 拖拽结束的处理函数
  const handleDragEnd = (event: any) => {
    const { active, over } = event
    // 检查是否是同一个元素
    if (active.id !== over.id) {
      const oldIndex = words.findIndex((item) => item.id === active.id) // 找到拖拽开始时的索引
      const newIndex = words.findIndex((item) => item.id === over.id) // 找到拖拽结束时的索引
      setWords((items) => arrayMove(items, oldIndex, newIndex)) // 更新单词列表顺序
    }
  }

  // SortableItem 组件
  const SortableItem: React.FC<{
    id: string
    word: string
    definition?: string
    phonetic?: string
    onEdit: () => void
    onDelete: () => void
  }> = ({ id, word, definition, phonetic, onEdit, onDelete }) => {
    // 使用useSortable获取拖拽属性
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id })

    const style = {
      transform: CSS.Translate.toString(transform), // 设置拖拽时的变换样式
      transition // 设置过渡效果
    }

    // 阻止指针事件冒泡
    const handlePointerDown = (event: React.PointerEvent<HTMLElement>) => {
      event.stopPropagation()
    }

    return (
      <Paper
        ref={setNodeRef} // 设置可拖拽的引用
        style={{
          ...style,
          marginBottom: '10px',
          padding: '10px',
          display: 'flex',
          alignItems: 'center'
        }}
        elevation={transform ? 5 : 1} // 设置拖拽时的阴影效果
        sx={{
          '&:hover': {
            backgroundColor: '#f0f8ff', // 悬停时改变背景颜色
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.2)' // 添加阴影效果
          }
        }}
        {...attributes} // 传递拖拽属性
        {...listeners} // 传递拖拽监听器
      >
        <Box flex={1}>
          <Typography variant="h6">{word}</Typography> // 显示单词
          {phonetic && <Typography variant="body2">[{phonetic}]</Typography>} // 显示音标（如果有）
          {definition && <Typography variant="body2">{definition}</Typography>} // 显示释义（如果有）
        </Box>
        <Box>
          <Tooltip title="编辑" arrow>
            <IconButton onClick={onEdit} onPointerDown={handlePointerDown} sx={{ '&:hover': { backgroundColor: '#e0f7fa' } }}>
              <Edit color="primary" /> // 编辑按钮
            </IconButton>
          </Tooltip>
          <Tooltip title="删除" arrow>
            <IconButton onClick={onDelete} onPointerDown={handlePointerDown} sx={{ '&:hover': { backgroundColor: '#ffcdd2' } }}>
              <Delete color="error" /> // 删除按钮
            </IconButton>
          </Tooltip>
        </Box>
      </Paper>
    )
  }

  return (
    <Box
      sx={{
        background: 'linear-gradient(135deg, #f0f8ff, #e6f7ff)', // 设置背景渐变
        minHeight: '100vh',
        padding: '20px',
        fontFamily: 'Poppins, sans-serif' // 设置字体
      }}
    >
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }} // 初始动画状态
        animate={{ opacity: 1, y: 0 }} // 动画结束状态
        transition={{ duration: 0.5 }} // 动画过渡设置
      >
        <Typography
          variant="h4"
          align="center"
          gutterBottom
          sx={{
            backgroundColor: '#e6f7ff',
            padding: '10px',
            borderRadius: '10px',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)' // 设置阴影效果
          }}
        >
          YouDao Pronouncer
        </Typography>
      </motion.div>

      {/* Add Button */}
      <Box display="flex" justifyContent="flex-end" mb={2}>
        <motion.div whileHover={{ scale: 1.1 }}> // 悬停时放大按钮
          <Button
            variant="contained"
            color="primary"
            onClick={handleAddWord}
            sx={{ borderRadius: '5px', transition: 'background-color 0.3s', '&:hover': { backgroundColor: '#1769aa' } }} // 设置按钮样式
          >
            添加单词
          </Button>
        </motion.div>
      </Box>

      {/* Word List */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd} // 设置拖拽结束后的处理函数
      >
        <SortableContext items={words.map((word) => word.id)} strategy={verticalListSortingStrategy}>
          <List>
            {words.map((item, index) => (
              <SortableItem
                key={item.id}
                id={item.id}
                word={item.word}
                definition={item.definition}
                phonetic={item.phonetic}
                onEdit={() => {
                  setEditingIndex(index) // 设置正在编辑的单词索引
                  setCurrentWord(item) // 设置当前单词状态
                  setIsModalOpen(true) // 打开模态框
                }}
                onDelete={() => handleDeleteWord(item.id)} // 设置删除单词的处理函数
              />
            ))}
          </List>
        </SortableContext>
      </DndContext>

      {/* Add/Edit Modal */}
      <Dialog open={isModalOpen} onClose={() => setIsModalOpen(false)}> // 设置模态框的打开状态和关闭处理函数
        <DialogTitle>{editingIndex !== null ? '编辑单词' : '添加单词'}</DialogTitle> // 根据编辑索引显示不同的标题
        <DialogContent>
          <TextField
            fullWidth
            label="单词"
            value={currentWord.word || ''} // 设置单词输入框的值
            onChange={(e) => setCurrentWord({ ...currentWord, word: e.target.value })} // 设置单词输入框的值变化处理函数
            margin="normal"
            sx={{
              '& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline': {
                borderColor: '#1976d2' // 聚焦时改变边框颜色
              }
            }}
          />
          <TextField
            fullWidth
            label="释义"
            value={currentWord.definition || ''} // 设置释义输入框的值
            onChange={(e) => setCurrentWord({ ...currentWord, definition: e.target.value })} // 设置释义输入框的值变化处理函数
            margin="normal"
            sx={{
              '& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline': {
                borderColor: '#1976d2' // 聚焦时改变边框颜色
              }
            }}
          />
          <TextField
            fullWidth
            label="音标"
            value={currentWord.phonetic || ''} // 设置音标输入框的值
            onChange={(e) => setCurrentWord({ ...currentWord, phonetic: e.target.value })} // 设置音标输入框的值变化处理函数
            margin="normal"
            sx={{
              '& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline': {
                borderColor: '#1976d2' // 聚焦时改变边框颜色
              }
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsModalOpen(false)} sx={{ transition: 'background-color 0.3s', '&:hover': { backgroundColor: '#ffcdd2' } }}>
            取消
          </Button>
          <Button onClick={handleSaveWord} variant="contained" color="primary" sx={{ transition: 'background-color 0.3s', '&:hover': { backgroundColor: '#1769aa' } }}>
            保存
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default WordListManager
