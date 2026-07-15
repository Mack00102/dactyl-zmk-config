# ZMK Dactyl Keyboard Handover

This document summarizes the work completed to set up the ZMK firmware for the custom split Dactyl keyboard, as well as the technical notes required for future hardware upgrades (Trackballs and LEDs).

## 1. Current State (Completed Work)
*   **Project Structure**: A complete, fully functional ZMK configuration module repository has been created.
*   **Custom Shield**: Defined `dactyl_left` and `dactyl_right` utilizing a shared `dactyl.dtsi` device tree file.
*   **Hardware Matrix**: The physical pin wiring has been mapped (8 Rows x 6 Columns per half) to the nice!nano v2 using the definitions provided in `pin_assignment.txt`.
*   **Keymap**: 
    *   **Default Layer**: Created a 66-key unified keymap for the Left and Right halves. 
    *   **Settings Layer**: Mapped the Left thumb `LGUI` key to a `&mo 1` layer shift. Layer 1 includes Bluetooth profile switching (`1`-`5`), Profile Clear (`~/\``), and USB/BLE output toggling (`6`, `7`).
*   **Power Optimization**: Enabled Deep Sleep (`CONFIG_ZMK_SLEEP=y`). The 500mAh battery will last for months without needing a physical power switch.
*   **Linux Compatibility**: Added ZMK's experimental BLE connection settings (`CONFIG_ZMK_BLE_EXPERIMENTAL_CONN=y`) to resolve the rapid connect/disconnect bouncing bug associated with Linux BlueZ.
*   **Zephyr 4.1 Compliance**: Configured `config/west.yml`, `build.yaml` (`nice_nano//zmk`), and `zephyr/module.yml` (`board_root: .`) to be compatible with ZMK's recent core upgrade.
*   **CI/CD**: Fully integrated with GitHub Actions. Committing and pushing to `main` automatically compiles the `.uf2` firmware files.

---

## 2. Future Hardware Upgrades (Next Steps)

### A. PMW3389 Trackballs (One per half)
ZMK supports Peripheral Pointing, meaning the right trackball will wirelessly transmit motion to the left half, and then to the PC.
*   **Driver**: There is no official PMW3389 driver built into ZMK yet. You must add a community-created Zephyr PMW3389 driver to the `config/west.yml` manifest so GitHub Actions pulls the code during compilation.
*   **Wiring**: The sensor requires an SPI connection (5 pins: MISO, MOSI, SCK, CS, and INT).
*   **Pin Shortage Solution**: The current 8x6 matrix leaves only 4 spare pins on the nice!nano edges. To get the required 5th pin, you have two options:
    1.  **Solder to the middle pads**: The nice!nano v2 has 3 extra GPIO pads on the bottom (`P1.01`, `P1.02`, `P1.07`).
    2.  **Optimize the Matrix (Recommended)**: Consolidate your Row 7 (Control) and Row 8 (Alt) thumb keys into the empty column slots of Row 5. This eliminates two rows entirely, freeing up 2 edge pins.
*   **Software**: Update `dactyl_left.overlay` to map the sensor to `mouse-move`, and `dactyl_right.overlay` to map it to `scroll`.

### B. WS2812B LEDs
*   **Wiring (CRITICAL)**: **Never wire LED power to the 3.3V (`VCC`) pin**. This will destroy the nice!nano's voltage regulator. You must wire the LED VCC to the `EXT_VCC` pin. This safely provides raw battery/USB power and allows ZMK to completely cut power to the LEDs during deep sleep.
*   **Data Pin**: Requires 1 spare GPIO pin (Logic level is 3.3V).
*   **Software**: Enable `CONFIG_ZMK_RGB_UNDERGLOW` in `dactyl.conf`. 
*   **Battery Life Warning**: Your 500mAh battery is massive for Bluetooth, but WS2812b LEDs pull a lot of power (~60mA per LED at full white). You must cap the global brightness in ZMK (e.g., 25%) to prevent the battery from draining in a matter of hours.

## 3. Useful Commands
*   `git add . && git commit -m "update" && git push origin main` -> Triggers a new firmware build.
*   `bluetoothctl` -> (Linux) Use `devices`, `remove [MAC]`, `trust [MAC]`, and `connect [MAC]` to troubleshoot Linux pairing issues.
