'use client'
import CharacterCard from '../components/CharacterCard'
import { useCallback, useEffect, useState } from 'react'
// import bookItems from '../bookItems.json'
import { Input } from '@/components/ui/input'
import { highlightText } from '../Utilities/HighlightText'
import { Button } from '@/components/ui/button'
import { Edit, Trash2Icon, CircleX, CircleCheck, Menu } from 'lucide-react'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

import {
  addCharacterToStory,
  addStoryPointToStory,
  checkUserExists,
  createStoryTitle,
  deleteCharacterFromStory,
  deleteStory,
  deleteStoryPointFromStory,
  getStories,
  getStoriesComplete,
  getStoryById,
  updateStoryCharacter,
  updateStoryStoryPoint,
  updateStoryTitle,
} from '../api/stories'

import { Book, BookDatatable, Character, StoryPoint } from '@/variables'
import { resolve } from 'path'
import { rejects } from 'assert'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { SkeletonCard } from '../Utilities/SkeletonCard'

export default function Home() {
  const [books, setBook] = useState<Book[]>([])

  const [userId, setuserId] = useState<string>('')

  const [selectedBookId, setSelectedBookId] = useState('1')
  const [storiesSearchQuery, setStoriesSearchQuery] = useState<string>('')
  const [characterSearchQuery, setCharacterSearchQuery] = useState<string>('')
  const [newBookTitle, setNewBookTitle] = useState<string>('')
  const [addNewStory, setAddNewStory] = useState(false)
  const [editingBookId, setEditingBookId] = useState<string | null>(null)
  const [editedBookTitle, setEditedBookTitle] = useState<string>('')
  const [originalBookTitle, setOriginalBookTitle] = useState<string>('')
  const [newCharacterCardName, setnewCharacterCardName] = useState<string>('')
  const [newCharacterCardDescription, setnewCharacterCardDescription] =
    useState<string>('')
  const [newStorypointTitle, setNewStorypointTitle] = useState<string>('')
  const [newStorypointDescription, setNewStorypointDescription] =
    useState<string>('')
  const [activeTab, setActiveTab] = useState('characters')
  const [editedStoryPointTitle, setEditedStoryPointTitle] = useState<string>('')
  const [editedStoryPointDescription, setEditedStoryPointDescription] =
    useState<string>('')

  const [isLeftPanelOpen, setIsLeftPanelOpen] = useState(false)
  const [isLoadingStories, setIsLoadingStories] = useState(true)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsLeftPanelOpen(window.innerWidth >= 640)
    }
  }, [])

  const togglePanel = () => {
    setIsLeftPanelOpen(!isLeftPanelOpen)
  }

  const editBookTitle = async (bookId: string, title: string) => {
    const updatedBooks = books.map(async (book) => {
      if (book.id === bookId) {
        //add loader here sample similar in all functions
        await updateStoryTitle(bookId, title)

        //end loader here
        return {
          ...book,
          title: title,
        }
      }
      return book
    })
    const resolvedBooks = await Promise.all(updatedBooks)
    setBook(resolvedBooks)

    setEditingBookId(null) // Exit editing mode
  }

  const readBook = (id: string) => {
    setSelectedBookId(id)
  }

  const storiesList = useCallback(async (id: string) => {
    setIsLoadingStories(true)

    try {
      const list = await getStoriesComplete(id)
      if (list && list.length > 0) {
        const booksData = toBookDatatableArray(list)
        setBook(booksData)
        setSelectedBookId(booksData[0].id)
      }
    } catch (error) {
      console.error('Failed to fetch stories', error)
    } finally {
      setIsLoadingStories(false)
    }
  }, [])

  const addCharacter = async () => {
    if (!newCharacterCardName.trim()) return // Prevent adding character with empty name

    const selectedBookIndex = books.findIndex(
      (book) => book.id === selectedBookId
    )
    if (selectedBookIndex !== -1) {
      const value: { id: string } | undefined | null =
        await addCharacterToStory(
          selectedBookId,
          newCharacterCardName,
          newCharacterCardDescription
        )

      if (value && value !== undefined) {
        const newCharacter: Character = {
          id: value.id,
          title: newCharacterCardName,
          description: newCharacterCardDescription,
        }
        const updatedBooks = [...books]
        updatedBooks[selectedBookIndex].characters.push(newCharacter)
        setBook(updatedBooks)

        // Reset input values after adding character
        setnewCharacterCardName('')
        setnewCharacterCardDescription('')
      }
    }
  }

  const addStorypoint = async () => {
    if (!newStorypointTitle.trim()) return // Prevent adding character with empty name

    const selectedBookIndex = books.findIndex(
      (book) => book.id === selectedBookId
    )
    if (selectedBookIndex !== -1) {
      const value: { id: string } | undefined | null =
        await addStoryPointToStory(
          selectedBookId,
          newStorypointTitle,
          newStorypointDescription
        )

      if (value && value !== undefined) {
        const newStorypoint: StoryPoint = {
          id: value.id,
          title: newStorypointTitle,
          description: newStorypointDescription,
        }

        const updatedBooks = [...books]
        updatedBooks[selectedBookIndex].storypoints.push(newStorypoint)
        setBook(updatedBooks)

        // Reset input values after adding character
        setNewStorypointTitle('')
        setNewStorypointDescription('')
      }
    }
  }

  const removeCharacter = (bookId: string, characterCardKey: string) => {
    deleteCharacterFromStory(bookId, characterCardKey)

    const updatedBooks = books.map((book) => {
      if (book.id === bookId) {
        return {
          ...book,
          characters: book.characters.filter(
            (character) => character.id !== characterCardKey
          ),
        }
      }
      return book
    })
    setBook(updatedBooks)
  }

  const handleStoriesSearchInputChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setStoriesSearchQuery(event.target.value)
  }

  const handleCharacterSearchInputChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setCharacterSearchQuery(event.target.value)
  }

  const getFilteredCharacters = () => {
    const selectedBook = books.find((book) => book.id === selectedBookId)
    if (!selectedBook) return []

    const normalize = (str: string) => str.replace(/\s+/g, '').toLowerCase()
    const query = normalize(characterSearchQuery)

    const filteredCharacters = selectedBook.characters.filter((character) =>
      normalize(character.title).includes(query)
    )

    // If there's a search query, sort the filtered characters to show them at the top
    return query
      ? filteredCharacters.sort((a, b) =>
          normalize(a.title).localeCompare(normalize(b.title))
        )
      : selectedBook.characters
  }

  const filteredBooks = books.filter((book) =>
    book.title
      .replace(/\s/g, '')
      .toLowerCase()
      .includes(storiesSearchQuery.replace(/\s/g, '').toLowerCase())
  )

  // const addNewBook = async () => {
  //   if (newBookTitle.trim() === '') {
  //     setAddNewStory(false)
  //     return // Prevent adding empty title
  //   }
  //   const storyId: { id: string } | undefined = await createStoryTitle(
  //     newBookTitle,
  //     userId
  //   )
  //   if (storyId) {
  //     const newBook: Book = {
  //       // Create new book object
  //       id: storyId.id,
  //       title: newBookTitle,
  //       characters: [],
  //       storypoints: [],
  //     }
  //     const updatedBooks = [newBook, ...books] // Add new book to the beginning of the books array
  //     setBook(updatedBooks) // Update books state
  //     // Reset input field
  //     setNewBookTitle('')
  //     if (!selectedBookId) {
  //       setSelectedBookId(newBook.id)
  //     }
  //   }
  // }

  const addNewBook = async () => {
    if (newBookTitle.trim() === '') {
      setAddNewStory(false)
      return // Prevent adding empty title
    }
    try {
      const storyId: { id: string } | undefined = await createStoryTitle(
        newBookTitle,
        userId
      )
      if (storyId) {
        const newBook: Book = {
          id: storyId.id,
          title: newBookTitle,
          characters: [],
          storypoints: [],
        }
        const updatedBooks = [newBook, ...books] // Add new book to the beginning of the books array
        setBook(updatedBooks) // Update books state

        // Reset input field
        setNewBookTitle('')

        // Update selected book ID if none is selected
        if (books.length === 0 || !selectedBookId) {
          setSelectedBookId(newBook.id)
        }
      } else {
        throw new Error('Failed to create story')
      }
    } catch (error) {
      console.error('Error adding new book:', error)
      // Optionally, handle error state/UI updates
    } finally {
      setAddNewStory(false) // Ensure add new story state is reset
    }
  }

  const handleAddNewStory = async () => {
    setAddNewStory((prev) => !prev)
  }

  const handleDeleteStory = async (bookId: string) => {
    // Filter the books array to remove the deleted story
    const updatedBooks = books.filter((item) => item.id !== bookId)

    try {
      // Delete the story from the backend database
      await deleteStory(bookId)

      // Update the state with the filtered array
      setBook(updatedBooks)

      // Check if the currently selected book is deleted
      if (selectedBookId === bookId) {
        // If deleted, set selectedBookId to the id of the first book in the updated array
        if (updatedBooks.length > 0) {
          setSelectedBookId(updatedBooks[0].id)
        } else {
          // If no books left, reset selectedBookId to an empty string or any default value
          setSelectedBookId('')
        }
      }
    } catch (error) {
      console.error('Error deleting story:', error)
      // Optionally, handle error state/UI updates
    }
  }

  const handleDeleteStoryPoint = (storyPointId: string) => {
    const updatedBooks = books.map((book) => {
      if (book.id === selectedBookId) {
        //function to delete story point
        deleteStoryPointFromStory(selectedBookId, storyPointId)
        //function to delete story point
        deleteStoryPointFromStory(selectedBookId, storyPointId)
        return {
          ...book,
          storypoints: book.storypoints.filter(
            (storypoint) => storypoint.id !== storyPointId
          ),
        }
      }
      return book
    })
    setBook(updatedBooks)
  }

  const handleEmptystoriesSearchQuery = () => {
    setStoriesSearchQuery('')
  }
  const handleEmptyCharacterSearchQuery = () => {
    setCharacterSearchQuery('')
  }
  const handleCharacterDialogClose = () => {
    // Reset input values or states related to the dialog here
    setnewCharacterCardName('')
    setnewCharacterCardDescription('')
  }

  const updateCharacter = (
    bookId: string,
    characterId: string,
    newTitle: string,
    newDescription: string
  ) => {
    const updatedBooks = books.map((book) => {
      if (book.id === bookId) {
        updateStoryCharacter(characterId, newTitle, newDescription)

        const updatedCharacters = book.characters.map((character) => {
          if (character.id === characterId) {
            return {
              ...character,
              title: newTitle,
              description: newDescription,
            }
          }
          return character
        })

        return {
          ...book,
          characters: updatedCharacters,
        }
      }
      return book
    })

    setBook(updatedBooks)
  }

  const updateStorypoint = (
    bookId: string,
    storypointId: string,
    newTitle: string,
    newDescription: string
  ) => {
    const updatedBooks = books.map((book) => {
      if (book.id === bookId) {
        updateStoryStoryPoint(storypointId, newTitle, newDescription)

        const updatedStorypoints = book.storypoints.map((storypoint) => {
          if (storypoint.id === storypointId) {
            return {
              ...storypoint,
              title: newTitle,
              description: newDescription,
            }
          }
          return storypoint
        })

        return {
          ...book,
          storypoints: updatedStorypoints,
        }
      }
      return book
    })
    setBook(updatedBooks)
  }

  const handleEditStorypoint = (title: string, description: string) => {
    setEditedStoryPointTitle(title)
    setEditedStoryPointDescription(description)
  }
  function toBookDatatableArray(data: any[]): Book[] {
    return data.map((item) => ({
      id: String(item.id), // Ensuring id is a string
      title: String(item.title), // Ensuring title is a string
      characters: item.characters as Character[],
      storypoints: item.storypoints as StoryPoint[],
    }))
  }
  useEffect(() => {
    setIsLoadingStories(true)
    const checkAndFetchStories = async () => {
      try {
        const userExists = await checkUserExists('testUser@bookminder.xyz')

        const user = await Promise.all(userExists)
        if (user.length > 0) {
          setuserId(user[0].id)
          storiesList(user[0].id)
        }
      } catch (error) {
        console.error('User check failed', error)
      } finally {
        setIsLoadingStories(false)
      }
    }
    checkAndFetchStories()
  }, [storiesList])

  return (
    <main>
      <div className=" flex flex-1 justify-center ">
        {isLoadingStories ? (
          <SkeletonCard />
        ) : (
          <div className=" border-r-0  px-2 bg-gray-50/40   dark:bg-gray-800/40  ">
            <div
              className={`absolute left-panel  ${
                isLeftPanelOpen ? 'open' : 'closed'
              }  sm:relative w-[300px]   sm:flex sm:flex-col  sm:min-w-[240px] sm:max-w-[350px] md:w-[450px]  bg-white border-b border-r shadow-lg sm:shadow-none min-h-[400px] py-4 z-20 h-screen`}
            >
              <div
                onClick={togglePanel}
                className=" w-30 h-30 sm:hidden mx-6 my-4 relative cursor-pointer"
              >
                {isLeftPanelOpen ? (
                  <CircleX className="ml-auto opacity-65" />
                ) : (
                  <Menu />
                )}
              </div>

              {/* Search input */}
              <div className="flex h-[65px] items-center  justify-center bg-white shadow-sm dark:bg-gray-950 ">
                <div className="flex flex-col justify-center items-center sm:flex-row sm:items-center sm:justify-center gap-2  font-regular text-gray-600 dark:text-gray-50  ">
                  <span className="text-lg">My Stories</span>
                  <div className="flex justify-center items-center gap-1 max-w-[300px] ">
                    {/* <Search className=" w-5 h-5 text-gray-500" /> */}
                    {books.length > 1 && (
                      <Input
                        value={storiesSearchQuery}
                        placeholder={`🔍 Search story`}
                        onChange={handleStoriesSearchInputChange}
                        className="h-8  font-small border-b-1 border-t-0 border-l-0 border-r-0 rounded-none"
                      />
                    )}

                    {storiesSearchQuery.length > 0 && (
                      <CircleX
                        color="rgb(107 114 128)"
                        opacity={0.7}
                        width={22}
                        height={22}
                        onClick={handleEmptystoriesSearchQuery}
                      />
                    )}
                  </div>
                </div>
              </div>
              <div className="flex-1 overflow-auto text-wrap whitespace-normal gap-4     ">
                <div className="text-wrap whitespace-normal px-4 ">
                  <div className="flex justify-center pb-1 pt-3 mt-6  ">
                    {storiesSearchQuery.length === 0 && (
                      <Button
                        className="add-new-story-buton h-8 font-bold  text-gray-600 transition hover:scale-105"
                        variant="outline"
                        onClick={handleAddNewStory}
                      >
                        {addNewStory ? 'Add later' : 'New Story'}
                      </Button>
                    )}
                  </div>
                  <div className="stories-panel  text-wrap whitespace-normal  flex flex-col gap-1  ">
                    {/* adding new title */}
                    <div className="   flex items-center flex-col sm:flex-row gap-2 rounded-lg px-3 py-1 text-gray-500 ">
                      {storiesSearchQuery.length === 0 && addNewStory && (
                        <>
                          <Input
                            type="text"
                            className="h-8 mr-10"
                            placeholder="Enter new story..."
                            value={newBookTitle}
                            onChange={(e) => {
                              if (e.target.value.length <= 50) {
                                // Set your desired character limit, e.g., 50
                                setNewBookTitle(e.target.value)
                              }
                            }}
                          />
                          <Button
                            className="text-gray-600 hover:text-gray-900 h-8  transition hover:scale-105"
                            onClick={addNewBook}
                            variant="outline"
                          >
                            Add story
                          </Button>
                        </>
                      )}
                    </div>

                    {/* Render filtered books while being searched in search box */}
                    {storiesSearchQuery.length >= 1 &&
                      filteredBooks.map((item, index) => (
                        <div
                          key={item.id}
                          className="flex items-center gap-2 rounded-lg px-3 py-2 text-gray-500 transition-all hover:bg-gray-100 hover:text-gray-900 text-lg dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-50 cursor-pointer "
                          onClick={() => readBook(item.id)}
                        >
                          {/* {item.title} */}
                          {highlightText(item.title, storiesSearchQuery)}
                        </div>
                      ))}
                    {storiesSearchQuery && filteredBooks.length === 0 && (
                      <div className="text-gray-500 flex bg-gray-100 h-8  rounded-full   justify-center items-center ">
                        No results...
                      </div>
                    )}
                    {/* Original book list */}
                    {storiesSearchQuery.length === 0 &&
                      books.map((item, index) => (
                        <>
                          {/* {index >= 1 && (
                          <Separator
                            className="border-t border-gray-200"
                            orientation="horizontal"
                          />
                        )} */}

                          <div className="flex flex-row justify-start items-center gap-2  ">
                            {editingBookId === item.id ? (
                              <>
                                <Input
                                  type="text"
                                  className={`h-10 w-50 flex justify-center items-center border-none text-lg text-gray-500 ${
                                    editingBookId === item.id
                                      ? 'bg-gray-100'
                                      : ''
                                  }`}
                                  value={editedBookTitle}
                                  onChange={(e) =>
                                    setEditedBookTitle(e.target.value)
                                  }
                                  placeholder={
                                    editedBookTitle.trim() !== ''
                                      ? ''
                                      : 'Please enter a title...'
                                  }
                                  onBlur={() => {
                                    if (editedBookTitle.trim() === '') {
                                      // Reset to original value and exit editing mode
                                      setEditedBookTitle(originalBookTitle)
                                      setEditingBookId(null)
                                    } else {
                                      // Save the edited title and exit editing mode
                                      editBookTitle(item.id, editedBookTitle)
                                      setEditingBookId(null)
                                    }
                                  }}
                                  onKeyDown={(e) => {
                                    if (
                                      e.key === 'Enter' ||
                                      e.key === 'Return'
                                    ) {
                                      e.currentTarget.blur() // Close editing mode
                                    }
                                  }}
                                  autoFocus // Automatically focuses the input field
                                />

                                <div className="ml-auto">
                                  <CircleCheck
                                    color="rgb(107 114 128)"
                                    height={22}
                                    width={22}
                                  />
                                </div>
                              </>
                            ) : (
                              <>
                                <div
                                  key={item.id}
                                  className={`flex items-center flex-row  rounded-lg px-4 py-2 text-gray-500 transition-all hover:bg-slate-100 hover:text-gray-900 text-lg dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-50 cursor-pointer  overflow-hidden w-full  pt-4 h-full ${
                                    selectedBookId === item.id
                                      ? 'bg-slate-200 text-gray-500'
                                      : ''
                                  }`}
                                  onClick={() => readBook(item.id)}
                                >
                                  {item.title}
                                </div>
                                <div className="ml-auto">
                                  <span className="flex flex-row gap-6 ">
                                    <Edit
                                      className="w-4 h-4 opacity-55 hover:opacity-100"
                                      onClick={() => {
                                        setEditedBookTitle(item.title) // Reset edited title
                                        setEditingBookId(item.id)
                                        setSelectedBookId(item.id)
                                        setOriginalBookTitle(item.title)
                                      }}
                                    />
                                    <Dialog>
                                      <DialogTrigger asChild>
                                        <Trash2Icon className="w-4 h-4 opacity-55 hover:opacity-100" />
                                      </DialogTrigger>
                                      <DialogContent className="flex flex-col justify-center items-center sm:max-w-[425px]">
                                        <DialogHeader>
                                          <DialogTitle>Delete</DialogTitle>
                                          <DialogDescription>
                                            Are you sure you want to permanently
                                            delete
                                            {` ${item.title}`}
                                          </DialogDescription>
                                        </DialogHeader>
                                        <DialogFooter className=" flex gap-4 flex-col    sm:flex-row  ">
                                          <DialogClose asChild>
                                            <Button
                                              variant="outline"
                                              type="submit"
                                              onClick={() =>
                                                handleDeleteStory(item.id)
                                              }
                                            >
                                              Yes
                                            </Button>
                                          </DialogClose>
                                          <DialogClose asChild>
                                            <Button
                                              variant="outline"
                                              type="submit"
                                            >
                                              No
                                            </Button>
                                          </DialogClose>
                                        </DialogFooter>
                                      </DialogContent>
                                    </Dialog>
                                  </span>
                                </div>
                              </>
                            )}
                          </div>
                        </>
                      ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        <div className="flex flex-1 flex-col ">
          {isLoadingStories ? (
            <SkeletonCard />
          ) : (
            <>
              <div
                onClick={togglePanel}
                className=" w-30 h-30 sm:hidden mx-6 my-4 relative cursor-pointer"
              >
                {!isLeftPanelOpen ? <Menu /> : ''}
              </div>
              <div className="text-center sm:flex h-20 items-center  sm:justify-start  bg-gray-50/40 px-6 shadow-sm dark:bg-gray-800/40  pt-3 ">
                <h1 className="text-3xl  font-semibold text-gray-600 dark:text-gray-50">
                  {books.find((item) => item.id === selectedBookId)?.title}
                  {!isLoadingStories && books.length === 0
                    ? 'Add a story title'
                    : ''}
                </h1>
                {/* <div className="flex items-center gap-2">sdfsdfsdf</div> */}
              </div>
              <div className="flex-1 overflow-auto p-3 ">
                <div className=" justify-center sm:justify-start flex gap-4 mb-4 ">
                  <button
                    className={`text-xl rounded-full font-medium text-gray-500 hover:bg-slate-100 mb-2 dark:text-gray-50 px-4 py-2 ${
                      activeTab === 'characters' ? 'bg-slate-200' : ''
                    }`}
                    onClick={() => setActiveTab('characters')}
                  >
                    Characters
                  </button>
                  <button
                    className={`text-xl rounded-full font-medium hover:bg-slate-100 text-gray-500 mb-2 dark:text-gray-50 px-4 py-2 ${
                      activeTab === 'storypoints' ? 'bg-slate-200' : ''
                    }`}
                    onClick={() => setActiveTab('storypoints')}
                  >
                    StoryPoints
                  </button>
                </div>

                {activeTab === 'characters' && (
                  <div className="character-tab p-4  ">
                    <div>
                      <Dialog>
                        <div className=" items-center sm:items-start flex flex-col  gap-4 justify-center sm:justify-start sm:flex-row">
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              className="max-w-[200px] h-8 w-30 mb-4"
                            >
                              Add character
                            </Button>
                          </DialogTrigger>
                          <div className=" flex justify-center   max-w-[300px] ">
                            {/* <Search className=" w-5 h-5 text-gray-500" /> */}
                            <Input
                              value={characterSearchQuery}
                              placeholder={`🔍 Search character...`}
                              onChange={handleCharacterSearchInputChange}
                              className="h-8 font-small border-b-1 border-t-0 border-l-0 border-r-0 rounded-none"
                            />
                            {characterSearchQuery.length > 0 && (
                              <CircleX
                                color="rgb(107 114 128)"
                                opacity={0.7}
                                width={22}
                                height={22}
                                onClick={handleEmptyCharacterSearchQuery}
                              />
                            )}
                          </div>
                        </div>
                        <DialogContent className="w-[350px] sm:max-w-[425px]">
                          <DialogHeader>
                            <DialogTitle className="text-2xl">
                              New character card
                            </DialogTitle>
                          </DialogHeader>
                          <div className="flex flex-col gap-10 py-4">
                            <div className="flex flex-col justify-start  gap-2 ">
                              <Label
                                htmlFor="name"
                                className="flex justify-start text-right"
                              >
                                Name
                              </Label>
                              <Input
                                id="name"
                                maxLength={50}
                                placeholder="New character title"
                                value={newCharacterCardName}
                                onChange={(e) =>
                                  setnewCharacterCardName(e.target.value)
                                }
                              />
                            </div>
                            <div className="flex flex-col justify-start  gap-2">
                              <p>Description</p>
                              <Textarea
                                maxLength={150}
                                placeholder="New character's description..."
                                value={newCharacterCardDescription}
                                onChange={(e) =>
                                  setnewCharacterCardDescription(e.target.value)
                                }
                              />
                            </div>
                          </div>
                          <DialogFooter className="flex flex-col gap-2 sm:flex-row">
                            <DialogClose
                              disabled={newCharacterCardName.length === 0}
                            >
                              <Button
                                disabled={newCharacterCardName.length === 0}
                                onClick={addCharacter}
                                className="text-gray-500"
                                type="submit"
                                variant="outline"
                              >
                                Add
                              </Button>
                            </DialogClose>
                            <DialogClose>
                              <Button
                                variant="outline"
                                className="text-gray-500"
                                onClick={handleCharacterDialogClose}
                              >
                                Cancel
                              </Button>
                            </DialogClose>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </div>
                    {characterSearchQuery.length === 0 && (
                      <div className="mt-10 gap-8 py-4 sm:grid sm:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 sm:gap-8 md:gap-6 lg:gap-4 sm:px-4 sm:py-6 overflow-y-auto sm:max-h-screen justify-center   flex flex-row flex-wrap">
                        {books
                          .find((item) => item.id === selectedBookId)
                          ?.characters.map((character) => (
                            <CharacterCard
                              key={character.id}
                              characterCardKey={character.id}
                              title={character.title}
                              description={character.description}
                              bookId={selectedBookId}
                              onDelete={removeCharacter}
                              onUpdate={updateCharacter}
                            />
                          ))}
                      </div>
                    )}
                    {characterSearchQuery.length > 0 && (
                      <div className="mt-10 gap-8 py-4 sm:grid sm:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 sm:gap-8 md:gap-6 lg:gap-4 sm:px-4 sm:py-6 overflow-y-auto sm:max-h-screen justify-center  flex flex-row flex-wrap">
                        {getFilteredCharacters().map((character) => (
                          <CharacterCard
                            key={character.id}
                            characterCardKey={character.id}
                            title={character.title}
                            description={character.description}
                            bookId={selectedBookId}
                            onDelete={removeCharacter}
                            onUpdate={updateCharacter}
                            characterSearchQuery={characterSearchQuery}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'storypoints' && (
                  <div className="storypoints-tab grid gap-4 ">
                    <div className=" p-2 overflow-y-auto h-screen ">
                      <div className="relative grid gap-4 pl-6 after:absolute after:inset-y-0 after:w-px after:bg-gray-500/20 dark:after:bg-gray-400/20">
                        {books
                          .find((item) => item.id === selectedBookId)
                          ?.storypoints.map((item) => (
                            <div
                              key={item.id}
                              className="grid gap-4 text-sm relative "
                            >
                              <div className="aspect-square w-3 bg-gray-900 rounded-full absolute left-0 translate-x-[-29.5px] z-10 top-1 dark:bg-gray-50 " />
                              <Accordion
                                type="single"
                                collapsible
                                className="font-medium"
                              >
                                <div className="aspect-square w-3 bg-gray-900 rounded-full absolute left-0 translate-x-[-29.5px] z-10 top-1 dark:bg-gray-50 " />
                                <AccordionItem value={`item-${item.id}`}>
                                  <AccordionTrigger className="flex justify-start  gap-6 mr-auto ">
                                    {item.title}
                                    <span className="flex gap-6">
                                      <Dialog>
                                        <DialogTrigger asChild>
                                          <Edit
                                            className="w-4 h-4 ml-10 opacity-55 hover:opacity-100"
                                            onClick={() =>
                                              handleEditStorypoint(
                                                item.title,
                                                item.description
                                              )
                                            }
                                          />
                                        </DialogTrigger>
                                        <DialogContent className="sm:max-w-[425px]">
                                          <DialogHeader>
                                            <DialogTitle className="text-2xl">
                                              {item.title}
                                            </DialogTitle>
                                          </DialogHeader>
                                          <div className="flex flex-col gap-10 py-4">
                                            <div className="flex flex-col justify-start  gap-2 ">
                                              <Label
                                                htmlFor="name"
                                                className="flex justify-start text-right"
                                              >
                                                Name
                                              </Label>
                                              <Input
                                                id="name"
                                                maxLength={100}
                                                placeholder="storypoint title"
                                                value={editedStoryPointTitle}
                                                onChange={(e) =>
                                                  setEditedStoryPointTitle(
                                                    e.target.value
                                                  )
                                                }
                                              />
                                            </div>
                                            <div className="flex flex-col justify-start  gap-2">
                                              <p>Description</p>
                                              <Textarea
                                                maxLength={3500}
                                                placeholder="storypoint's description..."
                                                value={
                                                  editedStoryPointDescription
                                                }
                                                onChange={(e) =>
                                                  setEditedStoryPointDescription(
                                                    e.target.value
                                                  )
                                                }
                                              />
                                            </div>
                                          </div>
                                          <DialogFooter>
                                            <DialogClose
                                              disabled={!editedStoryPointTitle}
                                            >
                                              <Button
                                                variant="outline"
                                                className="text-gray-500"
                                                onClick={() =>
                                                  updateStorypoint(
                                                    selectedBookId,
                                                    item.id,
                                                    editedStoryPointTitle,
                                                    editedStoryPointDescription
                                                  )
                                                }
                                                type="submit"
                                                disabled={
                                                  !editedStoryPointTitle
                                                }
                                              >
                                                update
                                              </Button>
                                            </DialogClose>
                                            <DialogClose>
                                              <Button
                                                variant="outline"
                                                className="text-gray-500"
                                              >
                                                Cancel
                                              </Button>
                                            </DialogClose>
                                          </DialogFooter>
                                        </DialogContent>
                                      </Dialog>
                                      <Trash2Icon
                                        className="w-4 h-4 opacity-55 hover:opacity-100"
                                        onClick={() => {
                                          handleDeleteStoryPoint(item.id)
                                        }}
                                      />
                                    </span>
                                  </AccordionTrigger>
                                  <AccordionContent className="text-gray-500 dark:text-gray-400">
                                    {item.description}
                                  </AccordionContent>
                                </AccordionItem>
                                {/* <div className="grid gap-1 text-sm relative">
                            <div className="aspect-square w-3 bg-gray-900 rounded-full absolute left-0 translate-x-[-29.5px] z-10 top-1 dark:bg-gray-50" />
                          </div> */}
                              </Accordion>
                            </div>
                          ))}
                      </div>
                      <div className="ml-6">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              className="h-8 max-w-[125px] my-4 mb-4"
                            >
                              Add storypoint
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-[425px]">
                            <DialogHeader>
                              <DialogTitle className="text-2xl">
                                New storypoint
                              </DialogTitle>
                            </DialogHeader>
                            <div className="flex flex-col gap-10 py-4">
                              <div className="flex flex-col justify-start  gap-2 ">
                                <Label
                                  htmlFor="title"
                                  className="flex justify-start text-right"
                                >
                                  Title
                                </Label>
                                <Input
                                  id="title"
                                  maxLength={100}
                                  placeholder="storypoint title..."
                                  value={newStorypointTitle}
                                  onChange={(e) =>
                                    setNewStorypointTitle(e.target.value)
                                  }
                                />
                              </div>
                              <div className="flex flex-col justify-start  gap-2">
                                <p>Description</p>
                                <Textarea
                                  maxLength={3500}
                                  placeholder="storypoint description..."
                                  value={newStorypointDescription}
                                  onChange={(e) =>
                                    setNewStorypointDescription(e.target.value)
                                  }
                                />
                              </div>
                            </div>
                            <DialogFooter>
                              <DialogClose disabled={!newStorypointTitle}>
                                <Button
                                  className="text-gray-500"
                                  type="submit"
                                  variant="outline"
                                  onClick={addStorypoint}
                                  disabled={!newStorypointTitle}
                                >
                                  Add
                                </Button>
                              </DialogClose>
                              <DialogClose>
                                <Button
                                  onClick={() => {
                                    setNewStorypointTitle('')
                                    setNewStorypointDescription('')
                                  }}
                                  variant="outline"
                                  className="text-gray-500"
                                >
                                  Cancel
                                </Button>
                              </DialogClose>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </main>
  )
}
