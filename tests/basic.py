import re
import config
from time import sleep
from selenium import webdriver

def log (text, status):
	if status == True:
		print '\033[92m[PASSED]\033[0m ' + text
	else:
		print '\033[91m[FAILED]\033[0m ' + text

def waitForElement (browser, selector, finalMsg = ''):
    time = 0.0
    maxTime = 5.0
    while time < maxTime:
        try:
            browser.find_element_by_css_selector(selector)
        except:
            time += 0.1
            sleep(0.1)
        else:
            log(finalMsg, 1)
            return True

    log(finalMsg, 0)
    return False

def waitForUrl (browser, url, finalMsg = ''):
    time = 0.0
    maxTime = 5.0
    while time < maxTime:
        if browser.current_url == url:
            log(finalMsg, 1)
            return True
        else:
            time += 0.1
            sleep(0.1)

    log(finalMsg, 0)
    return False

window = webdriver.Chrome()
window.set_window_size(414, 736)	    # 375 x 667
window.set_window_position(610, 0)     # 1024 - W x 0

rootURL = 'https://app.hollo.email' if config.production else 'https://app.hollo.dev'
print "\nLoading URL {}\n" . format(rootURL)
window.get(rootURL)

## Assure that Hollo loads without some tricky initial crash
waitForElement(window, 'login-page', 'Loading login page')
log('Path init to /auth/login', window.current_url == rootURL + '/auth/login')

if config.production:
    v_version = window.execute_script("return APPVER;")
    log('Version set correctly', v_version != 'dev' )

window.find_element_by_css_selector("input[type='email']").send_keys(config.username)
window.find_element_by_css_selector("input[type='password']").send_keys(config.password)

## Assure that main page is accessible
window.find_element_by_css_selector('button.login').click()
waitForElement(window, 'chats-page', 'Loading chats page')
log('Path changed to /chats', window.current_url == rootURL + '/chats')

## Test filtering
## t.b.d.

## Assure that profile page is accessible

window.find_element_by_css_selector('chats-page bottom-bar bar-icon:nth-child(1)').click()
waitForElement(window, 'profile-page', 'Loading profile page')
log('Path changed to /profile', window.current_url == rootURL + '/profile')

## Get back and try to click the first chat
window.find_element_by_css_selector('profile-page bottom-bar bar-icon:nth-child(2)').click()
waitForElement(window, 'chats-page', 'Get back to chat list')
window.find_element_by_css_selector('chats-page chat-row:nth-child(1)').click()
waitForElement(window, 'snackbar', 'Snackbar is present')
log('Path changed to /chat/*', '/chat/' in window.current_url)

print "\nTesting completed\n"
window.quit()
