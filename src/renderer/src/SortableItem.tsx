import React from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { List, Button } from 'antd'

interface SortableItemProps {
  id: string
  word: string
  onEdit: () => void
}

export const SortableItem: React.FC<SortableItemProps> = ({ id, word, onEdit }) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition
  }

  return (
    <List.Item
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      actions={[
        <Button type="link" onClick={onEdit}>
          编辑
        </Button>
      ]}
    >
      {word}
    </List.Item>
  )
}
