package main

import (
	"embed"

	"github.com/wailsapp/wails/v2"
	"github.com/wailsapp/wails/v2/pkg/options"
	"github.com/wailsapp/wails/v2/pkg/options/assetserver"
	"github.com/wailsapp/wails/v2/pkg/menu"
	"github.com/wailsapp/wails/v2/pkg/menu/keys"
	"github.com/wailsapp/wails/v2/pkg/runtime"
)

//go:embed all:frontend/dist
var assets embed.FS

func main() {
	// Create an instance of the app structure
	app := NewApp()

	// Create application menu
	appMenu := menu.NewMenu()
	FileMenu := appMenu.AddSubmenu("File")
	FileMenu.AddText("Quit", keys.CmdOrCtrl("q"), func(_ *menu.CallbackData) {
		runtime.Quit(app.ctx)
	})

	EditMenu := appMenu.AddSubmenu("Edit")
	// Define menu items using a struct for better organization and scalability (DRY/Open-Closed)
	type menuItem struct {
		Label   string
		Command string
	}

	editItems := []menuItem{
		{"Undo", "undo"},
		{"Redo", "redo"},
		{"Cut", "cut"},
		{"Copy", "copy"},
		{"Paste", "paste"},
		{"Select All", "selectAll"},
	}

	for _, item := range editItems {
		// Add separator before Cut
		if item.Label == "Cut" {
			EditMenu.AddSeparator()
		}

		// Capture item for closure
		cmd := item.Command
		EditMenu.AddText(item.Label, nil, func(_ *menu.CallbackData) {
			runtime.WindowExecJS(app.ctx, "document.execCommand('"+cmd+"')")
		})
	}

	// Create application with options
	err := wails.Run(&options.App{
		Title:  "Gostman",
		Width:  1024,
		Height: 768,
		AssetServer: &assetserver.Options{
			Assets: assets,
		},
		BackgroundColour: &options.RGBA{R: 27, G: 38, B: 54, A: 1},
		OnStartup:        app.startup,
		Menu:             appMenu,
		Bind: []interface{}{
			app,
		},
	})

	if err != nil {
		println("Error:", err.Error())
	}
}
