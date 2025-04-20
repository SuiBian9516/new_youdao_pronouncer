import React, { useState } from 'react'
import {
  Box,
  IconButton,
  Button,
  TextField,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
  Paper,
  Checkbox,
  Grid,
  Tooltip
} from '@mui/material'
import { Home, Edit, Delete } from '@mui/icons-material'
import { useNavigate } from 'react-router-dom'
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
  checked?: boolean
}

const EditPage: React.FC = () => {
  const navigate = useNavigate()
  const [words, setWords] = useState<WordItem[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [currentWord, setCurrentWord] = useState<Partial<WordItem>>({})
  const [editingIndex, setEditingIndex] = useState<number | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates
    })
  )

  const handleAddWord = () => {
    setIsModalOpen(true)
    setCurrentWord({})
    setEditingIndex(null)
  }

  const handleSaveWord = () => {
    if (!currentWord.word?.trim()) {
      alert('单词不能为空！')
      return
    }

    if (editingIndex !== null) {
      const updatedWords = [...words]
      updatedWords[editingIndex] = { ...updatedWords[editingIndex], ...currentWord }
      setWords(updatedWords)
    } else {
      setWords([...words, { id: `${Date.now()}`, ...currentWord } as WordItem])
    }
    setIsModalOpen(false)
  }

  const handleDeleteWord = (id: string) => {
    setWords(words.filter(word => word.id !== id))
  }

  const handleDeleteSelectedWords = () => {
    setWords(words.filter(word => !word.checked))
  }

  const handleDragEnd = (event: any) => {
    const { active, over } = event
    if (active.id !== over.id) {
      const oldIndex = words.findIndex(item => item.id === active.id)
      const newIndex = words.findIndex(item => item.id === over.id)
      setWords(items => arrayMove(items, oldIndex, newIndex))
    }
  }

  const handleToggleCheck = (id: string, event: React.ChangeEvent<HTMLInputElement>) => {
    event.stopPropagation()
    setWords(prevWords =>
      prevWords.map(word =>
        word.id === id ? { ...word, checked: !word.checked } : word
      )
    )
  }

  const SortableItem: React.FC<{
    id: string
    word: string
    definition?: string
    checked?: boolean
    onDelete: () => void
    onEdit: () => void
    onToggleCheck: (id: string, event: React.ChangeEvent<HTMLInputElement>) => void
  }> = ({ id, word, definition, checked, onDelete, onEdit, onToggleCheck }) => {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id })
    const style = {
      transform: CSS.Translate.toString(transform),
      transition
    }

    const handleAction = (e: React.MouseEvent | React.PointerEvent, callback: () => void) => {
      e.stopPropagation()
      callback()
    }

    return (
      <Paper
        ref={setNodeRef}
        style={{ ...style, marginBottom: '10px', padding: '10px', display: 'flex', alignItems: 'center' }}
        elevation={transform ? 5 : 1}
        sx={{
          '&:hover': {
            backgroundColor: '#f0f8ff',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.2)'
          },
          borderBottom: '2px solid #e0e0e0',
          paddingY: '8px',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
        {...attributes}
      >
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={1}>
            <Box onClick={e => e.stopPropagation()}>
              <Checkbox
                checked={checked}
                onChange={(e) => onToggleCheck(id, e)}
                onMouseDown={(e) => e.stopPropagation()}
                sx={{
                  '& .MuiSvgIcon-root': { fontSize: 28 },
                  '&:hover': { backgroundColor: 'transparent' }
                }}
              />
            </Box>
          </Grid>
          <Grid item xs={4} {...listeners} sx={{ cursor: 'grab' }}>
            <Typography variant="subtitle1">{word}</Typography>
          </Grid>
          <Grid item xs={5}>
            <Typography variant="body2" color="text.secondary">
              {definition}
            </Typography>
          </Grid>
          <Grid item xs={2}>
            <Box display="flex" justifyContent="flex-end">
              <Tooltip title="编辑" arrow>
                <IconButton
                  onClick={(e) => handleAction(e, onEdit)}
                  sx={{ '&:hover': { backgroundColor: '#e0f7fa' } }}
                >
                  <Edit color="primary" />
                </IconButton>
              </Tooltip>
              <Tooltip title="删除" arrow>
                <IconButton
                  onClick={(e) => handleAction(e, onDelete)}
                  sx={{ '&:hover': { backgroundColor: '#ffcdd2' } }}
                >
                  <Delete color="error" />
                </IconButton>
              </Tooltip>
            </Box>
          </Grid>
        </Grid>
      </Paper>
    )
  }

  return (
    <Box
      sx={{
        background: 'linear-gradient(135deg, #f0f8ff, #e6f7ff)',
        minHeight: '100vh',
        padding: '20px',
        fontFamily: 'Poppins, sans-serif'
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          pb: 2,
          borderBottom: '2px solid #e0e0e0'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Box sx={{ width: '50px', height: '50px', marginRight: '10px' }} />
          <Typography variant="h4" gutterBottom>
            Youdao Pronouncer
          </Typography>
        </Box>

        {/* Home 按钮 */}
        <IconButton
          onClick={() => navigate('/')}
          sx={{
            '&:hover': { backgroundColor: '#e0f7fa' }
          }}
        >
          <Home color="primary" />
        </IconButton>
      </Box>

      {/* 操作按钮 */}
      <Box display="flex" justifyContent="space-between" mb={2}>
        <motion.div whileHover={{ scale: 1.1 }}>
          <Button
            variant="contained"
            color="primary"
            onClick={handleAddWord}
            sx={{ borderRadius: '5px', transition: 'background-color 0.3s', '&:hover': { backgroundColor: '#1769aa' } }}
          >
            添加单词
          </Button>
        </motion.div>
        <motion.div whileHover={{ scale: 1.1 }}>
          <Button
            variant="contained"
            color="error"
            onClick={handleDeleteSelectedWords}
            sx={{ borderRadius: '5px', transition: 'background-color 0.3s', '&:hover': { backgroundColor: '#d32f2f' } }}
          >
            删除选中
          </Button>
        </motion.div>
      </Box>

      {/* 单词列表 */}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={words.map(word => word.id)} strategy={verticalListSortingStrategy}>
          <Box>
            {/* 表格表头 */}
            <Paper sx={{ mb: 1, p: 2, bgcolor: '#f5f5f5', borderBottom: '2px solid #e0e0e0', paddingY: '8px' }}>
              <Grid container spacing={2}>
                <Grid item xs={1}></Grid>
                <Grid item xs={4}>
                  <Typography variant="subtitle1" fontWeight="bold">单词</Typography>
                </Grid>
                <Grid item xs={5}>
                  <Typography variant="subtitle1" fontWeight="bold">释义</Typography>
                </Grid>
                <Grid item xs={2}></Grid>
              </Grid>
            </Paper>

            {/* 单词列表项 */}
            {words.map((item, index) => (
              <SortableItem
                key={item.id}
                id={item.id}
                word={item.word}
                definition={item.definition}
                checked={item.checked}
                onDelete={() => handleDeleteWord(item.id)}
                onEdit={() => {
                  setEditingIndex(index)
                  setCurrentWord(item)
                  setIsModalOpen(true)
                }}
                onToggleCheck={handleToggleCheck}
              />
            ))}
          </Box>
        </SortableContext>
      </DndContext>

      {/* 弹窗保持原状 */}
      <Dialog open={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <DialogTitle>{editingIndex !== null ? '编辑单词' : '添加单词'}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            label="单词"
            value={currentWord.word || ''}
            onChange={(e) => setCurrentWord({ ...currentWord, word: e.target.value })}
            margin="normal"
            sx={{
              '& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline': {
                borderColor: '#1976d2'
              }
            }}
          />
          <TextField
            fullWidth
            label="释义"
            value={currentWord.definition || ''}
            onChange={(e) => setCurrentWord({ ...currentWord, definition: e.target.value })}
            margin="normal"
            multiline
            rows={3}
            sx={{
              '& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline': {
                borderColor: '#1976d2'
              }
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsModalOpen(false)} sx={{ '&:hover': { backgroundColor: '#ffcdd2' } }}>
            取消
          </Button>
          <Button onClick={handleSaveWord} variant="contained" color="primary" sx={{ '&:hover': { backgroundColor: '#1769aa' } }}>
            保存
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default EditPage
