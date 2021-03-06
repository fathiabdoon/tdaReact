var React = require('react'),
    
    // -- Stores
    
    // -- Components
    AgencyMenu = require('./AgencyMenu.react'),
    UserMenu = require('./UserMenu.react');;




var MenuSearch = React.createClass({
    render:function(){
        return (
            <li className="visible-phone-landscape">
                <a href="#" id="search-toggle">
                    <i class="fa fa-search"></i>
                </a>
            </li>
        )
    }
})



var Header = React.createClass({
    render: function() {
        
        return (
            <header className="page-header">
                <div className="navbar">
                    <ul className="nav navbar-nav navbar-right pull-right">
                        
                        <AgencyMenu />
                        <UserMenu />
                        
                        <li className="visible-xs">
                            <a href="#" className="btn-navbar" data-toggle="collapse" data-target=".sidebar" title="">
                                <i className="fa fa-bars"></i>
                            </a>
                        </li>

                        <li className="hidden-xs"><a href="/logout"><i className="fa fa-sign-out"></i></a></li>
                    </ul>
                </div>
            </header>
        );
    }
});

module.exports = Header;
