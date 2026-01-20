"use client"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function HabitCreateDialog() {
  return (
    <Dialog>
      <form onSubmit={(event) => event.preventDefault()}>
        <DialogTrigger asChild>
          <Button type="button">Add habit</Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[460px]">
          <DialogHeader>
            <DialogTitle>Create habit</DialogTitle>
            <DialogDescription>
              Define the basics for a new habit. You can refine it later.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid gap-3">
              <Label htmlFor="habit-name">Name</Label>
              <Input
                id="habit-name"
                name="name"
                placeholder="Morning run"
              />
            </div>
            <div className="grid gap-3">
              <Label htmlFor="habit-description">Context / Description</Label>
              <Input
                id="habit-description"
                name="description"
                placeholder="Park, 20 minutes, easy pace"
              />
            </div>
            <div className="grid gap-3">
              <Label htmlFor="habit-capacity">Capacity</Label>
              <Input
                id="habit-capacity"
                name="capacity"
                placeholder="10 km"
              />
            </div>
            <div className="grid gap-3">
              <Label htmlFor="habit-microstep">Microstep</Label>
              <Input
                id="habit-microstep"
                name="microstep"
                placeholder="Put on running shoes"
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit">Add habit</Button>
          </DialogFooter>
        </DialogContent>
      </form>
    </Dialog>
  )
}
