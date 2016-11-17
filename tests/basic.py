import sys
import config
from time import sleep
from selenium import webdriver

window = webdriver.Chrome()

def log (text, status):
	if status == True:
		print '\033[92m[PASSED]\033[0m ' + text
	else:
		print '\033[91m[FAILED]\033[0m ' + text

def waitForElement (selector, finalMsg = '', critical = True):
    global window
    time = 0.0
    maxTime = 5.0
    while time < maxTime:
        try:
            window.find_element_by_css_selector(selector)
        except:
            time += 0.1
            sleep(0.1)
        else:
            log(finalMsg, 1)
            return True

    log(finalMsg, 0)

    if critical:
        raise ValueError('Timed out')

    return False

def waitForUrl (url, finalMsg = ''):
    global window
    time = 0.0
    maxTime = 5.0
    while time < maxTime:
        if window.current_url == url:
            log(finalMsg, 1)
            return True
        else:
            time += 0.1
            sleep(0.1)

    log(finalMsg, 0)
    return False

def element (selector, critical = True):
    global window
    element = None
    try:
        element = window.find_element_by_css_selector(selector)
    except:
        log('selector "{}"' . format(selector), 0)
        if critical:
            raise self.e

    return element

## Setup
window.set_window_size(414, 736)	    # 375 x 667
window.set_window_position(610, 0)      # 1024 - W x 0
if len(sys.argv) > 1:
    config.production = sys.argv[1]

rootURL = 'https://app.hollo.email' if config.production else 'https://app.hollo.dev'
print "\nLoading URL {} in {} mode\n" . format(rootURL, 'production' if config.production else 'development')
window.get(rootURL)

## Assure that Hollo loads without some tricky initial crash
waitForElement('login-page', 'Loading login page')
log('Path init to /auth/login', window.current_url == rootURL + '/auth/login')

if config.production:
    v_version = window.execute_script("return APPVER;")
    log('Version set correctly', v_version != 'dev' )

element("input[type='email']").send_keys(config.username)
element("input[type='password']").send_keys(config.password)

## Assure that main page is accessible
element('button.login').click()
waitForElement('chats-page', 'Loading chats page')
log('Path changed to /chats', window.current_url == rootURL + '/chats')

## Test filtering
## t.b.d.

## Assure that profile page is accessible
element('chats-page bottom-bar bar-icon:nth-of-type(1)').click()
waitForElement('profile-page', 'Loading profile page')
log('Path changed to /profile', window.current_url == rootURL + '/profile')

## Get back and try to click the first chat
element('profile-page bottom-bar bar-icon:nth-of-type(2)').click()
waitForElement('chats-page', 'Get back to chat list')
element('chats-page chat-row:nth-of-type(1)').click()
waitForElement('snackbar', 'Snackbar is present')
log('Path changed to /chat/*', '/chat/' in window.current_url)

## Check that all menues can be toggled
sleep(0.05)  # needs a small wait in production, no clue why
element('snackbar > div').click()
d_shader = element('messages-page div.modal-shader', False)
log('Modal menu shadow', d_shader.value_of_css_property('display') == 'block')
log('User picker menu', element('menu-modal.menu-users', False) != None)

element('snackbar bar-icon:nth-of-type(2)').click()
log('Subject piccker modal', element('menu-modal.menu-subjects', False) != None)

element('snackbar bar-icon:nth-of-type(3)').click()
log('Files modal', element('menu-modal.menu-files', False) != None)

element('snackbar bar-icon:nth-of-type(4)').click()
log('Moar modal', element('menu-modal.menu-more', False) != None)

print "\nTesting completed\n"
window.quit()
